# Testing Guide

## Overview

This project uses **Vitest** for testing. Tests cover checkout functionality, webhook processing, and provider adapter behavior.

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

## Test Structure

Tests are organized in `/src/tests/`:

```
src/tests/
├── checkout.test.js    # Checkout endpoint tests
├── webhook.test.js     # Webhook processing tests
└── adapter.test.js     # Provider adapter tests
```

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  let mockEnv;
  let mockLogger;

  beforeEach(() => {
    // Setup mocks before each test
    mockEnv = {
      SESSIONS: { put: vi.fn(), get: vi.fn() },
      // ... other KV namespaces
    };

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
  });

  it('should do something', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Mocking Cloudflare KV

```javascript
const mockKV = {
  get: vi.fn((key) => {
    // Return mock data based on key
    if (key === 'session:123') {
      return Promise.resolve(JSON.stringify({ userId: '123' }));
    }
    return Promise.resolve(null);
  }),
  put: vi.fn(() => Promise.resolve()),
  delete: vi.fn(() => Promise.resolve()),
};
```

### Mocking Fetch Requests

```javascript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
    text: () => Promise.resolve('test'),
  })
);
```

### Mocking Web Crypto API

```javascript
global.crypto = {
  subtle: {
    importKey: vi.fn(() => Promise.resolve({})),
    sign: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
  },
  randomUUID: vi.fn(() => 'test-uuid-123'),
};
```

## Test Coverage

Current test coverage includes:

### Checkout Tests (`checkout.test.js`)

✅ Validation of required fields  
✅ Successful checkout session creation  
✅ Unsupported provider handling  
✅ Default currency behavior  
✅ Error handling for API failures

### Webhook Tests (`webhook.test.js`)

✅ Missing signature rejection  
✅ Idempotent event handling  
✅ Backend notification forwarding  
✅ Graceful handling of backend failures  
✅ Event storage in KV

### Adapter Tests (`adapter.test.js`)

✅ Provider factory creation  
✅ Case-insensitive provider names  
✅ Paddle adapter functionality  
✅ PayPal adapter functionality  
✅ Access token caching  
✅ Error handling

## Testing Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```javascript
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});
```

### 2. Test Edge Cases

Always test:

- Valid inputs ✅
- Invalid inputs ❌
- Missing fields 🚫
- API failures 💥
- Network timeouts ⏱️

### 3. Mock External Dependencies

Never make real API calls in tests:

```javascript
// ✅ Good - Mocked
global.fetch = vi.fn(() => mockResponse);

// ❌ Bad - Real API call
const response = await fetch('https://api.paddle.com/...');
```

### 4. Descriptive Test Names

Use clear, descriptive test names:

```javascript
// ✅ Good
it('should reject checkout when email is missing', async () => {});

// ❌ Bad
it('test1', async () => {});
```

### 5. Arrange-Act-Assert Pattern

Structure tests clearly:

```javascript
it('should create checkout session', async () => {
  // Arrange
  const payload = { userId: '123', amount: 1000 };
  const mockResponse = { sessionId: 'txn_123' };

  // Act
  const result = await createCheckout(payload);

  // Assert
  expect(result.sessionId).toBe('txn_123');
});
```

## Integration Testing

### Testing with Wrangler Dev

Start the local development server:

```bash
npm run dev
```

Then test endpoints manually:

```bash
# Test checkout
curl -X POST http://localhost:8787/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paddle",
    "userId": "test_user",
    "email": "test@example.com",
    "amount": 1000,
    "productName": "Test Product"
  }'
```

### Testing Webhooks Locally

Use tools like [webhook.site](https://webhook.site) or ngrok to receive webhooks:

```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 8787

# Use the ngrok URL as your webhook endpoint
# Example: https://abc123.ngrok.io/api/webhook/paddle
```

## Provider-Specific Testing

### Paddle

Use Paddle's Sandbox environment:

1. Get sandbox API keys from [Paddle Dashboard](https://sandbox-vendors.paddle.com/)
2. Set `PADDLE_SANDBOX=true`
3. Use Paddle's webhook testing tool

### PayPal

Use PayPal's Sandbox environment:

1. Create sandbox accounts in [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Set `PAYPAL_SANDBOX=true`
3. Use PayPal's webhook simulator

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Debugging Tests

### Enable Verbose Logging

```bash
DEBUG=* npm test
```

### Run Specific Test File

```bash
npm test checkout.test.js
```

### Run Specific Test

```bash
npm test -t "should create checkout session"
```

### Use Console Logs

```javascript
it('should debug something', async () => {
  console.log('Debug info:', someVariable);
  expect(result).toBe(expected);
});
```

## Common Issues

### Issue: Tests timeout

**Solution:** Increase timeout for async operations:

```javascript
it('should handle slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: Mock not working

**Solution:** Ensure mocks are reset between tests:

```javascript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Issue: Environment variables not available

**Solution:** Set up mock environment in beforeEach:

```javascript
beforeEach(() => {
  mockEnv = {
    PADDLE_API_KEY: 'test_key',
    // ... other vars
  };
});
```

## Test Metrics

Good test coverage targets:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Testing](https://developers.cloudflare.com/workers/testing/)
- [Testing Best Practices](https://testingjavascript.com/)
