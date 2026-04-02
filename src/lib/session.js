const DEFAULT_SUBSCRIPTION = {
  plan: 'free',
  status: 'inactive',
  scansUsed: 0,
  scanLimit: 5,
  scansRemaining: 5,
  resetAt: null,
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

export function getStoredSubscription() {
  const raw = localStorage.getItem('checkoutfix_subscription');

  if (!raw) {
    return DEFAULT_SUBSCRIPTION;
  }

  try {
    return {
      ...DEFAULT_SUBSCRIPTION,
      ...JSON.parse(raw)
    };
  } catch {
    return DEFAULT_SUBSCRIPTION;
  }
}

export function persistSubscription(subscription = {}) {
  const payload = {
    ...DEFAULT_SUBSCRIPTION,
    ...subscription,
    features: {
      ...DEFAULT_SUBSCRIPTION.features,
      ...(subscription.features || {})
    }
  };

  localStorage.setItem('checkoutfix_subscription', JSON.stringify(payload));
}

export function clearStoredSession() {
  localStorage.removeItem('checkoutfix_token');
  localStorage.removeItem('checkoutfix_user');
  localStorage.removeItem('checkoutfix_subscription');
}
