/**
 * Common interface for payment provider adapters
 * All provider implementations should follow this interface
 */

/**
 * Base class for payment provider adapters
 */
export class ProviderAdapter {
  constructor(env, logger) {
    this.env = env;
    this.logger = logger;
  }

  /**
   * Create a checkout session
   * @param {object} payload - Checkout session parameters
   * @param {string} payload.userId - User identifier
   * @param {string} payload.email - User email
   * @param {number} payload.amount - Amount in cents
   * @param {string} payload.currency - Currency code (USD, EUR, etc.)
   * @param {string} payload.productName - Product name
   * @param {string} payload.successUrl - Success redirect URL
   * @param {string} payload.cancelUrl - Cancel redirect URL
   * @returns {Promise<object>} Session data with checkout URL
   */
  async createCheckoutSession(payload) {
    throw new Error('createCheckoutSession must be implemented by subclass');
  }

  /**
   * Verify webhook signature and return event data
   * @param {Request} request - Incoming webhook request
   * @returns {Promise<object>} Verified event data
   */
  async verifyWebhook(request) {
    throw new Error('verifyWebhook must be implemented by subclass');
  }

  /**
   * Get session details by session ID
   * @param {string} sessionId - Session identifier
   * @returns {Promise<object>} Session details
   */
  async getSession(sessionId) {
    throw new Error('getSession must be implemented by subclass');
  }

  /**
   * Create a subscription
   * @param {object} payload - Subscription parameters
   * @returns {Promise<object>} Subscription data
   */
  async createSubscription(payload) {
    throw new Error('createSubscription must be implemented by subclass');
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription identifier
   * @returns {Promise<object>} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    throw new Error('cancelSubscription must be implemented by subclass');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    throw new Error('getName must be implemented by subclass');
  }
}

/**
 * Factory function to get the appropriate provider adapter
 * @param {string} provider - Provider name (paddle, paypal, stripe)
 * @param {object} env - Environment variables
 * @param {object} logger - Logger instance
 * @returns {ProviderAdapter}
 */
export async function getProviderAdapter(provider, env, logger) {
  const providerName = provider.toLowerCase();

  switch (providerName) {
    case 'paddle': {
      const { PaddleAdapter } = await import('./paddle.js');
      return new PaddleAdapter(env, logger);
    }
    case 'paypal': {
      const { PayPalAdapter } = await import('./paypal.js');
      return new PayPalAdapter(env, logger);
    }
    case 'stripe': {
      const { StripeAdapter } = await import('./stripe.js');
      return new StripeAdapter(env, logger);
    }
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
