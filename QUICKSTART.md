# Quick Start Guide

Get up and running with the Payment System in 5 minutes!

## 🚀 Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Cloudflare account (free tier works)

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/hmthanh/PaymentMutipleProvider.git
cd PaymentMutipleProvider

# Install dependencies
npm install
```

## ⚙️ Configuration

### 1. Set Up Development Variables

```bash
# Copy the example file
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your credentials:

```bash
# For testing, use sandbox credentials
PADDLE_SANDBOX=true
PAYPAL_SANDBOX=true

# Get your API keys from:
# - Paddle: https://sandbox-vendors.paddle.com/
# - PayPal: https://developer.paypal.com/
```

### 2. Minimal Configuration (Optional)

You can start with mock values for local testing:

```bash
PADDLE_API_KEY=test_key
PADDLE_WEBHOOK_SECRET=test_secret
PAYPAL_CLIENT_ID=test_client_id
PAYPAL_CLIENT_SECRET=test_client_secret
PAYPAL_WEBHOOK_ID=test_webhook_id
INTERNAL_SECRET=my_secret_key
INTERNAL_BACKEND_URL=https://example.com
```

## 🏃 Running Locally

### Start the Worker

```bash
npm run dev
```

The worker will be available at: `http://localhost:8787`

### Test the API

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:8787/health
```

Expected response:

```json
{
  "success": true,
  "message": "Service is running",
  "data": {
    "status": "healthy"
  }
}
```

### Test Checkout (with mock data)

```bash
curl -X POST http://localhost:8787/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paddle",
    "userId": "user_123",
    "email": "test@example.com",
    "amount": 1000,
    "currency": "USD",
    "productName": "Test Product"
  }'
```

Note: This will fail without valid API credentials, but tests the endpoint structure.

## 🎨 Run the Frontend Demo

### 1. Install Frontend Dependencies

```bash
cd frontend/svelte
npm install
```

### 2. Start the Frontend

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Test the UI

The demo shows:

- Provider selection (Paddle, PayPal, Stripe)
- Email input
- Amount configuration
- Checkout button

## 🧪 Run Tests

```bash
# Back in the root directory
cd ../..

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

You should see all tests passing:

```
✓ src/tests/adapter.test.js  (11 tests)
✓ src/tests/checkout.test.js  (4 tests)
✓ src/tests/webhook.test.js  (4 tests)

Test Files  3 passed (3)
Tests  19 passed (19)
```

## 📋 Next Steps

### For Development

1. **Get Real API Keys**
   - Sign up for Paddle Sandbox
   - Create PayPal Developer account
   - Get test credentials

2. **Configure Webhooks**
   - Use ngrok for local webhook testing
   - Configure webhook URLs in provider dashboards

3. **Explore the Code**
   - Check `/src/adapters/` for provider implementations
   - Review `/src/router.js` for API endpoints
   - Look at `/src/tests/` for examples

### For Production

1. **Deploy to Cloudflare Workers**

   ```bash
   npm run deploy
   ```

2. **Set Up KV Namespaces**

   ```bash
   wrangler kv:namespace create "SESSIONS"
   wrangler kv:namespace create "EVENTS"
   wrangler kv:namespace create "METRICS"
   ```

3. **Configure Secrets**

   ```bash
   wrangler secret put PADDLE_API_KEY
   wrangler secret put PAYPAL_CLIENT_ID
   # ... etc
   ```

4. **Deploy Frontend**
   ```bash
   cd frontend/svelte
   npm run build
   npx wrangler pages deploy dist
   ```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Testing Guide](docs/TEST_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🎯 Common Use Cases

### Create a Checkout

```javascript
const response = await fetch('http://localhost:8787/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'paddle',
    userId: 'user_123',
    email: 'customer@example.com',
    amount: 2999, // $29.99
    currency: 'USD',
    productName: 'Premium Plan',
  }),
});

const data = await response.json();
// Redirect to: data.data.checkoutUrl
```

### Handle a Webhook

Webhooks are automatically processed at:

- Paddle: `POST /api/webhook/paddle`
- PayPal: `POST /api/webhook/paypal`

### Get Receipt

```bash
curl http://localhost:8787/api/receipt/{sessionId}
```

### Create Subscription

```bash
curl -X POST http://localhost:8787/api/subscription \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paddle",
    "userId": "user_123",
    "email": "customer@example.com",
    "priceId": "pri_abc123"
  }'
```

## ❓ Troubleshooting

### Port Already in Use

If port 8787 is already in use:

```bash
# Kill the process
lsof -ti:8787 | xargs kill -9

# Or use a different port
wrangler dev --port 8788
```

### Tests Failing

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

### Worker Not Starting

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest
```

## 💡 Tips

1. **Use Test Mode**: Always test with sandbox/test credentials first
2. **Check Logs**: Use `wrangler tail` to see real-time logs
3. **Read Docs**: Check provider documentation for API details
4. **Start Small**: Test one provider at a time
5. **Monitor KV**: Keep an eye on KV storage usage

## 🆘 Getting Help

- 📖 Read the [documentation](docs/)
- 🐛 [Report bugs](https://github.com/hmthanh/PaymentMutipleProvider/issues)
- 💬 Ask questions in [discussions](https://github.com/hmthanh/PaymentMutipleProvider/discussions)
- 📧 Contact maintainers

## ⭐ What's Next?

- Add Stripe support
- Implement retry logic for webhooks
- Create admin dashboard
- Add refund handling
- Build analytics features

Happy coding! 🎉
