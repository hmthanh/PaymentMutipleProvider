/**
 * API client for payment worker
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * Create a checkout session
 * @param {object} payload - Checkout parameters
 * @returns {Promise<object>}
 */
export async function createCheckoutSession(payload) {
  const response = await fetch(`${API_BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Get receipt information
 * @param {string} sessionId - Session identifier
 * @returns {Promise<object>}
 */
export async function getReceipt(sessionId) {
  const response = await fetch(`${API_BASE_URL}/api/receipt/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get receipt');
  }

  return response.json();
}

/**
 * Create a subscription
 * @param {object} payload - Subscription parameters
 * @returns {Promise<object>}
 */
export async function createSubscription(payload) {
  const response = await fetch(`${API_BASE_URL}/api/subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create subscription');
  }

  return response.json();
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Subscription identifier
 * @returns {Promise<object>}
 */
export async function cancelSubscription(subscriptionId) {
  const response = await fetch(`${API_BASE_URL}/api/subscription/${subscriptionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel subscription');
  }

  return response.json();
}
