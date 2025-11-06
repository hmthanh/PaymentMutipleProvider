/**
 * Tests for webhook endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleWebhook } from '../router.js';

describe('Webhook Endpoint', () => {
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    mockEnv = {
      EVENTS: {
        put: vi.fn(),
        get: vi.fn(() => Promise.resolve(null)), // Not processed by default
      },
      METRICS: {
        put: vi.fn(),
        get: vi.fn(() => Promise.resolve('0')),
      },
      PADDLE_WEBHOOK_SECRET: 'test_paddle_secret',
      PAYPAL_CLIENT_ID: 'test_paypal_id',
      PAYPAL_CLIENT_SECRET: 'test_paypal_secret',
      PAYPAL_WEBHOOK_ID: 'test_webhook_id',
      INTERNAL_BACKEND_URL: 'https://test-backend.com',
      INTERNAL_SECRET: 'test_internal_secret',
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  it('should reject webhooks with missing signature headers', async () => {
    const request = new Request('https://example.com/api/webhook/paddle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: 'evt_123',
        event_type: 'transaction.completed',
      }),
    });

    const response = await handleWebhook(request, mockEnv, mockLogger, 'paddle');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should handle unsupported provider', async () => {
    const request = new Request('https://example.com/api/webhook/unknown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: 'evt_123',
        event_type: 'test.event',
      }),
    });

    const response = await handleWebhook(request, mockEnv, mockLogger, 'unknown');
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unsupported payment provider');
  });

  it('should process webhook request structure correctly', async () => {
    // This tests the basic structure without full signature verification
    const request = new Request('https://example.com/api/webhook/paddle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'paddle-signature': 'ts=123456;h1=invalid',
      },
      body: JSON.stringify({
        event_id: 'evt_123',
        event_type: 'transaction.completed',
      }),
    });

    const response = await handleWebhook(request, mockEnv, mockLogger, 'paddle');
    
    // Will fail signature verification but tests the flow
    expect(response.status).toBe(400);
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should use correct webhook endpoints for different providers', async () => {
    const providers = ['paddle', 'paypal'];
    
    for (const provider of providers) {
      const request = new Request(`https://example.com/api/webhook/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: 'evt_test',
          event_type: 'test.event',
        }),
      });

      const response = await handleWebhook(request, mockEnv, mockLogger, provider);
      
      // All should fail due to missing signatures, but should process the provider correctly
      expect(response.status).toBe(400);
    }
  });
});
