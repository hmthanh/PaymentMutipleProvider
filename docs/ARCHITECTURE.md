# Payment System Architecture

## Overview

This payment system is built as a **Cloudflare Worker** that acts as an **Edge Orchestrator** for multiple payment providers. It follows the **Adapter Pattern** to support Paddle, PayPal, and Stripe (coming soon).

## Architecture Diagram

```
┌─────────────┐
│   Client    │
│  (Svelte)   │
└──────┬──────┘
       │
       │ POST /api/checkout
       │
       ▼
┌─────────────────────────────────┐
│   Cloudflare Worker (Edge)      │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Router & Middleware     │  │
│  │  - CORS                  │  │
│  │  - Logging               │  │
│  │  - Rate Limiting         │  │
│  └────────┬─────────────────┘  │
│           │                     │
│  ┌────────▼─────────────────┐  │
│  │   Provider Adapters      │  │
│  │  ┌──────────────────┐    │  │
│  │  │ Paddle Adapter   │    │  │
│  │  ├──────────────────┤    │  │
│  │  │ PayPal Adapter   │    │  │
│  │  ├──────────────────┤    │  │
│  │  │ Stripe Adapter   │    │  │
│  │  └──────────────────┘    │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │   KV Storage             │  │
│  │  - Sessions              │  │
│  │  - Event Idempotency     │  │
│  │  - Metrics               │  │
│  └──────────────────────────┘  │
└─────────┬───────────────────────┘
          │
          │ Forward events
          │
          ▼
┌─────────────────────────┐
│   Origin Backend        │
│  /internal/payment/notify│
│  - Persistence          │
│  - Email notifications  │
│  - Analytics            │
└─────────────────────────┘
```

## Key Components

### 1. Router (`src/router.js`)

The router handles all incoming requests and dispatches them to appropriate handlers:

- **`/api/checkout`**: Creates a checkout session with the selected provider
- **`/api/webhook/:provider`**: Receives and verifies webhooks from payment providers
- **`/api/receipt/:sessionId`**: Retrieves receipt information
- **`/api/subscription`**: Creates and manages subscriptions
- **`/health`**: Health check endpoint

### 2. Provider Adapters (`src/adapters/`)

Each payment provider has a dedicated adapter that implements a common interface:

```javascript
interface ProviderAdapter {
  createCheckoutSession(payload)
  verifyWebhook(request)
  getSession(sessionId)
  createSubscription(payload)
  cancelSubscription(subscriptionId)
  getName()
}
```

**Current Implementations:**

- **PaddleAdapter**: Full implementation for Paddle payments
- **PayPalAdapter**: Full implementation for PayPal payments
- **StripeAdapter**: Placeholder for future Stripe implementation

### 3. KV Storage (`src/utils/kv.js`)

Cloudflare KV is used for:

- **Session Management**: Store checkout session metadata
- **Idempotency**: Prevent duplicate webhook processing
- **Metrics**: Track usage and errors

### 4. Webhook Processing

Webhook handling follows this flow:

1. **Receive webhook** from payment provider
2. **Verify signature** using provider-specific method
3. **Check idempotency** - has this event been processed?
4. **Mark as processed** in KV storage
5. **Forward to backend** for persistence and business logic
6. **Return success** to provider

### 5. Security

- **Signature Verification**: All webhooks are verified using HMAC or provider-specific methods
- **Secrets Management**: All sensitive credentials stored as Wrangler secrets
- **CORS Configuration**: Proper CORS headers for frontend integration
- **Rate Limiting**: Can be implemented using Cloudflare's built-in features

## Data Flow

### Checkout Flow

1. User clicks "Pay" button in frontend
2. Frontend calls `POST /api/checkout` with payment details
3. Worker selects appropriate provider adapter
4. Adapter creates checkout session with provider
5. Session metadata stored in KV
6. Checkout URL returned to frontend
7. User redirected to provider's checkout page

### Webhook Flow

1. Payment provider sends webhook to `/api/webhook/:provider`
2. Worker verifies webhook signature
3. Check if event already processed (idempotency)
4. Store event ID in KV
5. Forward event data to origin backend
6. Return success to provider

## Edge Advantages

Running on Cloudflare Workers provides:

- **Global Distribution**: Low latency from any location
- **Automatic Scaling**: No infrastructure management
- **High Availability**: Built-in redundancy
- **Cost Efficiency**: Pay only for what you use
- **DDoS Protection**: Built-in security

## Extensibility

To add a new payment provider:

1. Create a new adapter file in `src/adapters/`
2. Implement the `ProviderAdapter` interface
3. Add provider to the factory in `providerAdapter.js`
4. Add environment variables in `wrangler.toml`
5. Write tests in `src/tests/`

## Environment Variables

All environment variables should be set as Wrangler secrets:

```bash
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK_SECRET
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
wrangler secret put PAYPAL_WEBHOOK_ID
wrangler secret put INTERNAL_SECRET
```

See `src/config/env.example.json` for a complete list.
