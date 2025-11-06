/**
 * Tests for checkout endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCheckout } from '../router.js';

describe('Checkout Endpoint', () => {
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    mockEnv = {
      SESSIONS: {
        put: vi.fn(),
        get: vi.fn(),
      },
      METRICS: {
        put: vi.fn(),
        get: vi.fn(),
      },
      PADDLE_API_KEY: 'test_paddle_key',
      PAYPAL_CLIENT_ID: 'test_paypal_id',
      PAYPAL_CLIENT_SECRET: 'test_paypal_secret',
      INTERNAL_BACKEND_URL: 'https://test-backend.com',
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  it('should reject requests with missing required fields', async () => {
    const request = new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paddle',
        // Missing userId, email, amount, productName
      }),
    });

    const response = await handleCheckout(request, mockEnv, mockLogger);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('should create a checkout session with valid data', async () => {
    // Mock fetch for Paddle API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: 'txn_123',
              checkout: { url: 'https://paddle.com/checkout/123' },
            },
          }),
      })
    );

    const request = new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paddle',
        userId: 'user_123',
        email: 'test@example.com',
        amount: 1000,
        currency: 'USD',
        productName: 'Test Product',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
    });

    const response = await handleCheckout(request, mockEnv, mockLogger);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('sessionId');
    expect(data.data).toHaveProperty('checkoutUrl');
    expect(mockEnv.SESSIONS.put).toHaveBeenCalled();
  });

  it('should handle unsupported payment provider', async () => {
    const request = new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'unsupported',
        userId: 'user_123',
        email: 'test@example.com',
        amount: 1000,
        productName: 'Test Product',
      }),
    });

    const response = await handleCheckout(request, mockEnv, mockLogger);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unsupported payment provider');
  });

  it('should use default currency if not provided', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: 'txn_123',
              checkout: { url: 'https://paddle.com/checkout/123' },
            },
          }),
      })
    );

    const request = new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'paddle',
        userId: 'user_123',
        email: 'test@example.com',
        amount: 1000,
        productName: 'Test Product',
        // No currency specified
      }),
    });

    const response = await handleCheckout(request, mockEnv, mockLogger);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
