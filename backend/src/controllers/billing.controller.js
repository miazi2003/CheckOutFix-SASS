const User = require('../models/user.model');
const {
  activateProSubscription,
  buildSubscriptionPayload,
  cancelToFreePlan,
  syncSubscriptionCycle
} = require('../services/subscription.service');
const { getFrontendUrl, getRequiredPriceId, getStripeClient } = require('../services/stripe.service');

async function findUserForStripeEvent(eventObject) {
  const metadataUserId = eventObject.metadata?.userId;

  if (metadataUserId) {
    const userByMetadata = await User.findById(metadataUserId);
    if (userByMetadata) {
      return userByMetadata;
    }
  }

  if (eventObject.customer) {
    const userByCustomer = await User.findOne({ 'subscription.stripeCustomerId': eventObject.customer });
    if (userByCustomer) {
      return userByCustomer;
    }
  }

  if (eventObject.subscription) {
    return User.findOne({ 'subscription.stripeSubscriptionId': eventObject.subscription });
  }

  return null;
}

exports.createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stripe = getStripeClient();
    const frontendUrl = getFrontendUrl();
    const priceId = getRequiredPriceId();

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user._id.toString()
        }
      });

      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      user.markModified('subscription');
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      allow_promotion_codes: true,
      success_url: `${frontendUrl}/app/settings?billing=success`,
      cancel_url: `${frontendUrl}/app/settings?billing=cancelled`,
      client_reference_id: user._id.toString(),
      metadata: {
        userId: user._id.toString()
      },
      subscription_data: {
        metadata: {
          userId: user._id.toString()
        }
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ error: 'Unable to start checkout session' });
  }
};

exports.createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.subscription?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this account yet.' });
    }

    const stripe = getStripeClient();
    const frontendUrl = getFrontendUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${frontendUrl}/app/settings`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Create portal session error:', error);
    return res.status(500).json({ error: 'Unable to open billing portal' });
  }
};

exports.getBillingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    syncSubscriptionCycle(user);
    user.markModified('subscription');
    await user.save();

    return res.status(200).json({
      subscription: buildSubscriptionPayload(user)
    });
  } catch (error) {
    console.error('Get billing status error:', error);
    return res.status(500).json({ error: 'Unable to load billing status' });
  }
};

exports.handleWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ error: 'Missing STRIPE_WEBHOOK_SECRET' });
  }

  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const user = await findUserForStripeEvent(session);

        if (user) {
          user.subscription.stripeCustomerId = session.customer || user.subscription.stripeCustomerId || '';
          user.subscription.stripeSubscriptionId = session.subscription || user.subscription.stripeSubscriptionId || '';
          activateProSubscription(user, {
            status: 'active'
          });
          await user.save();
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const user = await findUserForStripeEvent(subscription);

        if (user) {
          user.subscription.stripeCustomerId = subscription.customer || user.subscription.stripeCustomerId || '';
          user.subscription.stripeSubscriptionId = subscription.id;
          activateProSubscription(user, {
            status: subscription.status,
            currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : undefined,
            currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
          });
          await user.save();
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await findUserForStripeEvent(subscription);

        if (user) {
          cancelToFreePlan(user, {
            status: 'canceled'
          });
          user.subscription.stripeSubscriptionId = '';
          await user.save();
        }
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
};
