/**
 * Paddle payment provider adapter
 * Implements the ProviderAdapter interface for Paddle
 */

import { ProviderAdapter } from './providerAdapter.js';
import { verifyHmacSignature } from '../utils/webhook.js';

export class PaddleAdapter extends ProviderAdapter {
  constructor(env, logger) {
    super(env, logger);
    this.apiKey = env.PADDLE_API_KEY;
    this.webhookSecret = env.PADDLE_WEBHOOK_SECRET;
    this.baseUrl = env.PADDLE_SANDBOX === 'true' 
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';
  }

  getName() {
    return 'paddle';
  }

  /**
   * Create a checkout session with Paddle
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
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              price: {
                description: productName,
                unit_price: {
                  amount: String(amount),
                  currency_code: currency,
                },
              },
              quantity: 1,
            },
          ],
          customer: {
            email,
          },
          custom_data: {
            user_id: userId,
            ...metadata,
          },
          return_url: successUrl,
          checkout: {
            url: cancelUrl,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Paddle API error: ${error}`);
      }

      const data = await response.json();

      this.logger.info('Paddle checkout session created', {
        sessionId: data.data.id,
        userId,
      });

      return {
        sessionId: data.data.id,
        checkoutUrl: data.data.checkout?.url || data.data.url,
        provider: 'paddle',
      };
    } catch (error) {
      this.logger.error('Failed to create Paddle checkout session', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Verify Paddle webhook signature
   */
  async verifyWebhook(request) {
    const signature = request.headers.get('paddle-signature');
    if (!signature) {
      throw new Error('Missing Paddle signature header');
    }

    // Clone request to read body multiple times
    const requestClone = request.clone();
    const payload = await request.text();
    const eventData = await requestClone.json();

    // Paddle uses ts and h1 in signature
    const sigParts = {};
    signature.split(';').forEach((part) => {
      const [key, value] = part.split('=');
      sigParts[key] = value;
    });

    const timestamp = sigParts.ts;
    const receivedSignature = sigParts.h1;

    if (!timestamp || !receivedSignature) {
      throw new Error('Invalid Paddle signature format');
    }

    // Verify signature using HMAC SHA-256
    const signedPayload = `${timestamp}:${payload}`;
    const isValid = await verifyHmacSignature(
      signedPayload,
      receivedSignature,
      this.webhookSecret
    );

    if (!isValid) {
      throw new Error('Invalid Paddle webhook signature');
    }

    this.logger.info('Paddle webhook verified', {
      eventType: eventData.event_type,
      eventId: eventData.event_id,
    });

    return {
      eventId: eventData.event_id,
      eventType: eventData.event_type,
      data: eventData.data,
      rawPayload: eventData,
    };
  }

  /**
   * Get Paddle session/transaction details
   */
  async getSession(sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Paddle session: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      this.logger.error('Failed to get Paddle session', {
        error: error.message,
        sessionId,
      });
      throw error;
    }
  }

  /**
   * Create a subscription with Paddle
   */
  async createSubscription(payload) {
    const { userId, email, priceId, successUrl, cancelUrl } = payload;

    try {
      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            email,
          },
          items: [
            {
              price_id: priceId,
              quantity: 1,
            },
          ],
          custom_data: {
            user_id: userId,
          },
          return_url: successUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Paddle subscription error: ${error}`);
      }

      const data = await response.json();

      this.logger.info('Paddle subscription created', {
        subscriptionId: data.data.id,
        userId,
      });

      return {
        subscriptionId: data.data.id,
        checkoutUrl: data.data.checkout?.url,
        provider: 'paddle',
      };
    } catch (error) {
      this.logger.error('Failed to create Paddle subscription', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Cancel a Paddle subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            effective_from: 'next_billing_period',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel Paddle subscription: ${response.statusText}`);
      }

      const data = await response.json();

      this.logger.info('Paddle subscription cancelled', {
        subscriptionId,
      });

      return data.data;
    } catch (error) {
      this.logger.error('Failed to cancel Paddle subscription', {
        error: error.message,
        subscriptionId,
      });
      throw error;
    }
  }
}
