/**
 * Tests for provider adapters
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProviderAdapter } from '../adapters/providerAdapter.js';
import { PaddleAdapter } from '../adapters/paddle.js';
import { PayPalAdapter } from '../adapters/paypal.js';

describe('Provider Adapter Factory', () => {
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    mockEnv = {
      PADDLE_API_KEY: 'test_paddle_key',
      PADDLE_WEBHOOK_SECRET: 'test_paddle_secret',
      PAYPAL_CLIENT_ID: 'test_paypal_id',
      PAYPAL_CLIENT_SECRET: 'test_paypal_secret',
      PAYPAL_WEBHOOK_ID: 'test_webhook_id',
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  it('should return PaddleAdapter for paddle provider', async () => {
    const adapter = await getProviderAdapter('paddle', mockEnv, mockLogger);
    expect(adapter).toBeInstanceOf(PaddleAdapter);
    expect(adapter.getName()).toBe('paddle');
  });

  it('should return PayPalAdapter for paypal provider', async () => {
    const adapter = await getProviderAdapter('paypal', mockEnv, mockLogger);
    expect(adapter).toBeInstanceOf(PayPalAdapter);
    expect(adapter.getName()).toBe('paypal');
  });

  it('should be case insensitive for provider names', async () => {
    const adapter1 = await getProviderAdapter('PADDLE', mockEnv, mockLogger);
    const adapter2 = await getProviderAdapter('PayPal', mockEnv, mockLogger);
    
    expect(adapter1).toBeInstanceOf(PaddleAdapter);
    expect(adapter2).toBeInstanceOf(PayPalAdapter);
  });

  it('should throw error for unsupported provider', async () => {
    await expect(
      getProviderAdapter('unknown', mockEnv, mockLogger)
    ).rejects.toThrow('Unsupported payment provider: unknown');
  });
});

describe('PaddleAdapter', () => {
  let adapter;
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    mockEnv = {
      PADDLE_API_KEY: 'test_paddle_key',
      PADDLE_WEBHOOK_SECRET: 'test_paddle_secret',
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    adapter = new PaddleAdapter(mockEnv, mockLogger);
  });

  it('should have correct provider name', () => {
    expect(adapter.getName()).toBe('paddle');
  });

  it('should create checkout session successfully', async () => {
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

    const result = await adapter.createCheckoutSession({
      userId: 'user_123',
      email: 'test@example.com',
      amount: 1000,
      currency: 'USD',
      productName: 'Test Product',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result).toHaveProperty('sessionId', 'txn_123');
    expect(result).toHaveProperty('checkoutUrl');
    expect(result).toHaveProperty('provider', 'paddle');
  });

  it('should handle API errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        text: () => Promise.resolve('API Error'),
      })
    );

    await expect(
      adapter.createCheckoutSession({
        userId: 'user_123',
        email: 'test@example.com',
        amount: 1000,
        productName: 'Test Product',
      })
    ).rejects.toThrow('Paddle API error');
  });
});

describe('PayPalAdapter', () => {
  let adapter;
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    mockEnv = {
      PAYPAL_CLIENT_ID: 'test_client_id',
      PAYPAL_CLIENT_SECRET: 'test_client_secret',
      PAYPAL_WEBHOOK_ID: 'test_webhook_id',
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    adapter = new PayPalAdapter(mockEnv, mockLogger);
  });

  it('should have correct provider name', () => {
    expect(adapter.getName()).toBe('paypal');
  });

  it('should get access token successfully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'test_token',
            expires_in: 3600,
          }),
      })
    );

    const token = await adapter.getAccessToken();
    expect(token).toBe('test_token');
  });

  it('should cache access token', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'test_token',
            expires_in: 3600,
          }),
      })
    );
    global.fetch = fetchMock;

    await adapter.getAccessToken();
    await adapter.getAccessToken(); // Second call should use cache

    // Should only call fetch once
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should create checkout session successfully', async () => {
    global.fetch = vi
      .fn()
      // First call for access token
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'test_token',
              expires_in: 3600,
            }),
        })
      )
      // Second call for order creation
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 'order_123',
              links: [{ rel: 'approve', href: 'https://paypal.com/checkout/123' }],
            }),
        })
      );

    const result = await adapter.createCheckoutSession({
      userId: 'user_123',
      email: 'test@example.com',
      amount: 1000,
      currency: 'USD',
      productName: 'Test Product',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result).toHaveProperty('sessionId', 'order_123');
    expect(result).toHaveProperty('checkoutUrl');
    expect(result).toHaveProperty('provider', 'paypal');
  });
});
