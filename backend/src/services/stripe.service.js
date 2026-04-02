const Stripe = require('stripe');

let stripeClient;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
  ).replace(/\/+$/, '');
}

function getRequiredPriceId() {
  const priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

  if (!priceId) {
    throw new Error('Missing STRIPE_PRICE_ID_PRO_MONTHLY');
  }

  return priceId;
}

module.exports = {
  getFrontendUrl,
  getRequiredPriceId,
  getStripeClient
};
