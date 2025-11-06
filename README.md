# Payment System on Cloudflare Workers

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready **payment orchestration system** running on **Cloudflare Workers** (Edge). Supports multiple payment providers with a clean adapter pattern, webhook handling, idempotency, and comprehensive testing.

## 🚀 Features

- 💳 **Multiple Payment Providers**: Paddle, PayPal, and Stripe (coming soon)
- ⚡ **Edge-First Architecture**: Deployed on Cloudflare Workers for global low latency
- 🔐 **Secure Webhook Handling**: Signature verification and idempotency checks
- 💾 **KV Storage Integration**: Session management and event tracking
- 📊 **Built-in Monitoring**: Logging and metrics collection
- 🧪 **Comprehensive Testing**: Vitest test suite with high coverage
- 🎨 **Frontend Integration**: Svelte 5 checkout demo
- 📚 **Complete Documentation**: API reference, architecture, and testing guides

## 📁 Project Structure

```
/
├── src/
│   ├── index.js              # Main Worker entrypoint
│   ├── worker.js             # Worker export
│   ├── router.js             # API route handlers
│   ├── adapters/             # Payment provider adapters
│   │   ├── providerAdapter.js
│   │   ├── paddle.js
│   │   ├── paypal.js
│   │   └── stripe.js
│   ├── utils/                # Utility modules
│   │   ├── kv.js
│   │   ├── webhook.js
│   │   ├── response.js
│   │   └── logger.js
│   ├── tests/                # Test files
│   │   ├── checkout.test.js
│   │   ├── webhook.test.js
│   │   └── adapter.test.js
│   └── config/
│       └── env.example.json
├── frontend/
│   └── svelte/               # Svelte 5 demo app
│       ├── src/
│       │   ├── App.svelte
│       │   ├── main.js
│       │   └── lib/api.js
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
├── docs/
│   ├── ARCHITECTURE.md       # Architecture overview
│   ├── API_REFERENCE.md      # API documentation
│   └── TEST_GUIDE.md         # Testing guide
├── wrangler.toml             # Cloudflare Worker config
├── package.json
└── README.md
```

## 🏁 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account (for deployment)
- Payment provider accounts (Paddle, PayPal, Stripe)

### Installation

```bash
# Clone the repository
git clone https://github.com/hmthanh/PaymentMutipleProvider.git
cd PaymentMutipleProvider

# Install dependencies
npm install
```

### Configuration

1. **Copy environment example:**
```bash
cp src/config/env.example.json .dev.vars.example
```

2. **Set up Wrangler secrets:**
```bash
# Paddle
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK_SECRET

# PayPal
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
wrangler secret put PAYPAL_WEBHOOK_ID

# Internal
wrangler secret put INTERNAL_SECRET
```

3. **Configure KV namespaces:**
```bash
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "EVENTS"
wrangler kv:namespace create "METRICS"
```

Update the namespace IDs in `wrangler.toml`.

### Development

```bash
# Start local development server
npm run dev

# Worker will be available at http://localhost:8787
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## 📡 API Endpoints

### Checkout
```bash
POST /api/checkout
```

Create a checkout session with a payment provider.

### Webhooks
```bash
POST /api/webhook/:provider
```

Receive and process webhooks from payment providers.

### Receipt
```bash
GET /api/receipt/:sessionId
```

Retrieve receipt information for a payment.

### Subscription
```bash
POST /api/subscription
DELETE /api/subscription/:subscriptionId
```

Manage subscriptions.

See [API_REFERENCE.md](docs/API_REFERENCE.md) for detailed documentation.

## 🎨 Frontend Integration

### Svelte 5 Demo

```bash
cd frontend/svelte
npm install
npm run dev
```

Open http://localhost:5173 to see the checkout demo.

### Example Usage

```javascript
import { createCheckoutSession } from './lib/api.js';

const session = await createCheckoutSession({
  provider: 'paddle',
  userId: 'user_123',
  email: 'customer@example.com',
  amount: 2999, // $29.99 in cents
  currency: 'USD',
  productName: 'Premium Plan',
});

// Redirect to checkout
window.location.href = session.data.checkoutUrl;
```

## 🏗️ Architecture

The system uses the **Adapter Pattern** to support multiple payment providers:

```
Client → Worker → Provider Adapter → Payment Provider
                ↓
              KV Storage (Sessions, Events, Metrics)
                ↓
          Origin Backend (Notifications)
```

Key components:
- **Router**: Routes requests to appropriate handlers
- **Adapters**: Provider-specific implementations
- **KV Storage**: Session and event management
- **Logger**: Structured logging and metrics

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## 🔐 Security

- ✅ Webhook signature verification
- ✅ Idempotency checks
- ✅ Secrets management via Wrangler
- ✅ CORS configuration
- ✅ Rate limiting ready

## 📊 Monitoring

Built-in logging and metrics:
- Request/response logging
- Error tracking
- Webhook processing metrics
- Provider-specific counters

## 🧪 Testing

Comprehensive test coverage:
- Unit tests for all adapters
- Integration tests for API endpoints
- Webhook verification tests
- Error handling tests

See [TEST_GUIDE.md](docs/TEST_GUIDE.md) for testing guidelines.

## 🛠️ Supported Providers

| Provider | Status | Features |
|----------|--------|----------|
| **Paddle** | ✅ Ready | Checkout, Webhooks, Subscriptions |
| **PayPal** | ✅ Ready | Checkout, Webhooks, Subscriptions |
| **Stripe** | 🚧 Coming Soon | Placeholder ready |

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PADDLE_API_KEY` | Paddle API key | For Paddle |
| `PADDLE_WEBHOOK_SECRET` | Paddle webhook secret | For Paddle |
| `PAYPAL_CLIENT_ID` | PayPal client ID | For PayPal |
| `PAYPAL_CLIENT_SECRET` | PayPal client secret | For PayPal |
| `PAYPAL_WEBHOOK_ID` | PayPal webhook ID | For PayPal |
| `INTERNAL_SECRET` | Internal API secret | Yes |
| `INTERNAL_BACKEND_URL` | Backend notification URL | Yes |

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Paddle API](https://developer.paddle.com/)
- [PayPal API](https://developer.paypal.com/)
- [Svelte Documentation](https://svelte.dev/)

## 💡 Use Cases

- **SaaS Applications**: Handle subscription payments
- **E-commerce**: Process one-time payments
- **Marketplaces**: Multi-provider payment support
- **Global Platforms**: Low-latency edge processing

## 🎯 Roadmap

- [x] Paddle integration
- [x] PayPal integration
- [x] Webhook handling
- [x] Frontend demo
- [x] Comprehensive testing
- [ ] Stripe integration
- [ ] Retry logic for failed webhooks
- [ ] Advanced metrics dashboard
- [ ] Multi-currency support
- [ ] Refund handling

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check the documentation in `/docs`
- Review test files for examples

---

Built with ❤️ using Cloudflare Workers, Svelte 5, and modern web technologies.