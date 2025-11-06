/**
 * PayPal payment provider adapter
 * Implements the ProviderAdapter interface for PayPal
 */

import { ProviderAdapter } from './providerAdapter.js';

export class PayPalAdapter extends ProviderAdapter {
  constructor(env, logger) {
    super(env, logger);
    this.clientId = env.PAYPAL_CLIENT_ID;
    this.clientSecret = env.PAYPAL_CLIENT_SECRET;
    this.webhookId = env.PAYPAL_WEBHOOK_ID;
    this.baseUrl =
      env.PAYPAL_SANDBOX === 'true'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  getName() {
    return 'paypal';
  }

  /**
   * Get PayPal access token (with caching)
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = btoa(`${this.clientId}:${this.clientSecret}`);
      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get PayPal access token', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Create a checkout session (PayPal Order)
   */
  async createCheckoutSession(payload) {
    const {
      userId,
      email,
      amount,
      currency = 'USD',
      productName,
      successUrl,
      cancelUrl,
      metadata = {},
    } = payload;

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: (amount / 100).toFixed(2), // Convert cents to dollars
              },
              description: productName,
              custom_id: userId,
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brand_name: 'Payment System',
                locale: 'en-US',
                landing_page: 'LOGIN',
                user_action: 'PAY_NOW',
                return_url: successUrl,
                cancel_url: cancelUrl,
              },
            },
          },
          application_context: {
            return_url: successUrl,
            cancel_url: cancelUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal API error: ${error}`);
      }

      const data = await response.json();

      // Find approval link
      const approvalLink = data.links.find((link) => link.rel === 'approve');

      this.logger.info('PayPal order created', {
        orderId: data.id,
        userId,
      });

      return {
        sessionId: data.id,
        checkoutUrl: approvalLink?.href || '',
        provider: 'paypal',
      };
    } catch (error) {
      this.logger.error('Failed to create PayPal order', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Verify PayPal webhook signature
   */
  async verifyWebhook(request) {
    const webhookId = this.webhookId;
    const headers = {
      'transmission-id': request.headers.get('paypal-transmission-id'),
      'transmission-time': request.headers.get('paypal-transmission-time'),
      'cert-url': request.headers.get('paypal-cert-url'),
      'auth-algo': request.headers.get('paypal-auth-algo'),
      'transmission-sig': request.headers.get('paypal-transmission-sig'),
    };

    if (!headers['transmission-id'] || !headers['transmission-sig']) {
      throw new Error('Missing PayPal webhook headers');
    }

    const requestClone = request.clone();
    const payload = await request.text();
    const eventData = await requestClone.json();

    try {
      const token = await this.getAccessToken();

      // Verify webhook using PayPal's verification endpoint
      const response = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transmission_id: headers['transmission-id'],
          transmission_time: headers['transmission-time'],
          cert_url: headers['cert-url'],
          auth_algo: headers['auth-algo'],
          transmission_sig: headers['transmission-sig'],
          webhook_id: webhookId,
          webhook_event: eventData,
        }),
      });

      if (!response.ok) {
        throw new Error(`PayPal webhook verification failed: ${response.statusText}`);
      }

      const verification = await response.json();

      if (verification.verification_status !== 'SUCCESS') {
        throw new Error('Invalid PayPal webhook signature');
      }

      this.logger.info('PayPal webhook verified', {
        eventType: eventData.event_type,
        eventId: eventData.id,
      });

      return {
        eventId: eventData.id,
        eventType: eventData.event_type,
        data: eventData.resource,
        rawPayload: eventData,
      };
    } catch (error) {
      this.logger.error('PayPal webhook verification error', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get PayPal order details
   */
  async getSession(sessionId) {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get PayPal order: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.logger.error('Failed to get PayPal order', {
        error: error.message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Create a subscription with PayPal
   */
  async createSubscription(payload) {
    const { userId, email, planId, successUrl, cancelUrl } = payload;

    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          subscriber: {
            email_address: email,
          },
          custom_id: userId,
          application_context: {
            brand_name: 'Payment System',
            locale: 'en-US',
            user_action: 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            },
            return_url: successUrl,
            cancel_url: cancelUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal subscription error: ${error}`);
      }

      const data = await response.json();

      // Find approval link
      const approvalLink = data.links.find((link) => link.rel === 'approve');

      this.logger.info('PayPal subscription created', {
        subscriptionId: data.id,
        userId,
      });

      return {
        subscriptionId: data.id,
        checkoutUrl: approvalLink?.href || '',
        provider: 'paypal',
      };
    } catch (error) {
      this.logger.error('Failed to create PayPal subscription', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Cancel a PayPal subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Customer requested cancellation',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel PayPal subscription: ${response.statusText}`);
      }

      this.logger.info('PayPal subscription cancelled', {
        subscriptionId,
      });

      return { status: 'cancelled', subscriptionId };
    } catch (error) {
      this.logger.error('Failed to cancel PayPal subscription', {
        error: error.message,
        subscriptionId,
      });
      throw error;
    }
  }
}
