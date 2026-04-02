import { API_BASE } from '../config';
import { persistSubscription } from './session';

async function parseJsonResponse(res) {
  const text = await res.text();

  if (!text) {
    return {};
  }

  return JSON.parse(text);
}

function getAuthHeaders(includeJson = false) {
  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
  };
}

export async function startCheckout() {
  const res = await fetch(`${API_BASE}/billing/checkout-session`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to start checkout');
  }

  if (!data.url) {
    throw new Error('Checkout URL was not returned');
  }

  window.location.assign(data.url);
}

export async function openBillingPortal() {
  const res = await fetch(`${API_BASE}/billing/portal-session`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to open billing portal');
  }

  if (!data.url) {
    throw new Error('Billing portal URL was not returned');
  }

  window.location.assign(data.url);
}

export async function refreshBillingStatus() {
  const res = await fetch(`${API_BASE}/billing/status`, {
    headers: getAuthHeaders()
  });
  const data = await parseJsonResponse(res);

  if (!res.ok) {
    throw new Error(data.error || 'Unable to load billing status');
  }

  if (data.subscription) {
    persistSubscription(data.subscription);
  }

  return data.subscription;
}
