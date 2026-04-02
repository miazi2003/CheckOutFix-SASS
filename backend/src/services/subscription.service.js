const FREE_PLAN = {
  id: 'free',
  scanLimit: 5,
  storesLimit: 1,
  allowedFrequencies: ['daily'],
  features: {
    manualScans: true,
    scheduledScans: true,
    alerts: true,
    fullHistory: false,
    prioritySupport: false
  }
};

const PRO_PLAN = {
  id: 'pro',
  scanLimit: null,
  storesLimit: 25,
  allowedFrequencies: ['hourly', '6h', 'daily'],
  features: {
    manualScans: true,
    scheduledScans: true,
    alerts: true,
    fullHistory: true,
    prioritySupport: true
  }
};

function getPlanConfig(plan) {
  return plan === 'pro' ? PRO_PLAN : FREE_PLAN;
}

function getNextResetDate(fromDate = new Date()) {
  return new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, 1));
}

function ensureSubscriptionState(user) {
  const planConfig = getPlanConfig(user.subscription?.plan);

  if (!user.subscription) {
    user.subscription = {};
  }

  if (user.subscription.plan !== 'pro') {
    user.subscription.plan = 'free';
  }

  if (!user.subscription.status) {
    user.subscription.status = user.subscription.plan === 'pro' ? 'active' : 'inactive';
  }

  if (typeof user.subscription.scansUsed !== 'number') {
    user.subscription.scansUsed = 0;
  }

  if (!user.subscription.resetAt) {
    user.subscription.resetAt = getNextResetDate();
  }

  if (!user.subscription.currentPeriodStart) {
    user.subscription.currentPeriodStart = new Date();
  }

  if (user.subscription.plan === 'pro') {
    user.subscription.scanLimit = null;
    user.subscription.storesLimit = PRO_PLAN.storesLimit;
  } else {
    user.subscription.scanLimit = FREE_PLAN.scanLimit;
    user.subscription.storesLimit = FREE_PLAN.storesLimit;
  }

  return planConfig;
}

function resetUsageWindowIfNeeded(user) {
  const planConfig = ensureSubscriptionState(user);
  const resetAt = new Date(user.subscription.resetAt);
  const now = new Date();

  if (Number.isNaN(resetAt.getTime()) || resetAt <= now) {
    user.subscription.scansUsed = 0;
    user.subscription.resetAt = getNextResetDate(now);
    user.subscription.currentPeriodStart = now;
    user.subscription.currentPeriodEnd = user.subscription.resetAt;
  }

  return planConfig;
}

function buildSubscriptionPayload(user) {
  const planConfig = resetUsageWindowIfNeeded(user);
  const scanLimit = user.subscription.plan === 'pro' ? null : planConfig.scanLimit;
  const scansRemaining = scanLimit === null
    ? null
    : Math.max(scanLimit - (user.subscription.scansUsed || 0), 0);

  return {
    plan: user.subscription.plan,
    status: user.subscription.status,
    scansUsed: user.subscription.scansUsed || 0,
    scanLimit,
    scansRemaining,
    resetAt: user.subscription.resetAt,
    storesLimit: planConfig.storesLimit,
    allowedFrequencies: planConfig.allowedFrequencies,
    features: planConfig.features,
    currentPeriodStart: user.subscription.currentPeriodStart || null,
    currentPeriodEnd: user.subscription.currentPeriodEnd || user.subscription.resetAt || null
  };
}

function activateProSubscription(user, overrides = {}) {
  ensureSubscriptionState(user);

  user.subscription.plan = 'pro';
  user.subscription.status = overrides.status || 'active';
  user.subscription.scanLimit = null;
  user.subscription.storesLimit = PRO_PLAN.storesLimit;
  user.subscription.currentPeriodStart = overrides.currentPeriodStart || user.subscription.currentPeriodStart || new Date();
  user.subscription.currentPeriodEnd = overrides.currentPeriodEnd || user.subscription.currentPeriodEnd || null;
  user.markModified('subscription');
}

function cancelToFreePlan(user, overrides = {}) {
  ensureSubscriptionState(user);

  user.subscription.plan = 'free';
  user.subscription.status = overrides.status || 'inactive';
  user.subscription.scansUsed = 0;
  user.subscription.scanLimit = FREE_PLAN.scanLimit;
  user.subscription.storesLimit = FREE_PLAN.storesLimit;
  user.subscription.currentPeriodStart = overrides.currentPeriodStart || new Date();
  user.subscription.resetAt = getNextResetDate();
  user.subscription.currentPeriodEnd = overrides.currentPeriodEnd || user.subscription.resetAt || null;
  user.markModified('subscription');
}

function syncSubscriptionCycle(user) {
  return resetUsageWindowIfNeeded(user);
}

function canRunScan(user) {
  const planConfig = resetUsageWindowIfNeeded(user);

  if (user.subscription.plan === 'pro') {
    return { allowed: true, reason: null, planConfig };
  }

  if ((user.subscription.scansUsed || 0) >= planConfig.scanLimit) {
    return {
      allowed: false,
      reason: 'Free scan limit reached for this billing period.',
      code: 'PLAN_LIMIT_REACHED',
      planConfig
    };
  }

  return { allowed: true, reason: null, planConfig };
}

function canCreateStore(user, existingStoreCount) {
  const planConfig = resetUsageWindowIfNeeded(user);

  if (existingStoreCount >= planConfig.storesLimit) {
    return {
      allowed: false,
      reason: `Your ${user.subscription.plan} plan supports up to ${planConfig.storesLimit} monitored store${planConfig.storesLimit === 1 ? '' : 's'}.`,
      code: 'STORE_LIMIT_REACHED',
      planConfig
    };
  }

  return { allowed: true, reason: null, planConfig };
}

function validateScanFrequency(user, scanFrequency) {
  const planConfig = resetUsageWindowIfNeeded(user);

  if (!planConfig.allowedFrequencies.includes(scanFrequency)) {
    return {
      allowed: false,
      reason: `${scanFrequency} scans are available on the Pro plan.`,
      code: 'FREQUENCY_NOT_AVAILABLE',
      planConfig
    };
  }

  return { allowed: true, reason: null, planConfig };
}

function recordSuccessfulScan(user) {
  resetUsageWindowIfNeeded(user);

  if (user.subscription.plan !== 'pro') {
    user.subscription.scansUsed = (user.subscription.scansUsed || 0) + 1;
  }

  user.markModified('subscription');
}

module.exports = {
  activateProSubscription,
  buildSubscriptionPayload,
  cancelToFreePlan,
  canCreateStore,
  canRunScan,
  ensureSubscriptionState,
  recordSuccessfulScan,
  syncSubscriptionCycle,
  resetUsageWindowIfNeeded,
  validateScanFrequency
};
