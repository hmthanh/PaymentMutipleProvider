# Svelte Frontend

## Overview

This is a Svelte 5 demo application showcasing integration with the payment system worker.

## Features

- 💳 Dynamic provider selection (Paddle, PayPal, Stripe)
- ✨ Reactive UI with Svelte 5 runes
- 🎨 Beautiful, responsive design
- 🔄 Real-time form validation
- 🚀 Fast and lightweight

## Setup

### Install dependencies

```bash
cd frontend/svelte
npm install
```

### Configure API URL

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8787
```

For production:

```bash
VITE_API_URL=https://your-worker.workers.dev
```

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Deployment

### Deploy to Cloudflare Pages

1. Build the app:

```bash
npm run build
```

2. Deploy to Cloudflare Pages:

```bash
npx wrangler pages deploy dist
```

Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

### Environment Variables

Set in Cloudflare Pages dashboard:

- `VITE_API_URL`: Your worker URL

## Usage

### Basic Checkout

```javascript
import { createCheckoutSession } from './lib/api.js';

const session = await createCheckoutSession({
  provider: 'paddle',
  userId: 'user_123',
  email: 'customer@example.com',
  amount: 2999, // $29.99
  currency: 'USD',
  productName: 'Premium Plan',
  successUrl: 'https://yourapp.com/success',
  cancelUrl: 'https://yourapp.com/cancel',
});

// Redirect to checkout
window.location.href = session.data.checkoutUrl;
```

### Custom Integration

You can use the API client in your own Svelte components:

```svelte
<script>
  import { createCheckoutSession } from './lib/api.js';

  async function handlePurchase() {
    try {
      const result = await createCheckoutSession({
        provider: 'paddle',
        userId: currentUser.id,
        email: currentUser.email,
        amount: 1999,
        productName: 'My Product',
      });

      window.location.href = result.data.checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  }
</script>

<button onclick={handlePurchase}>
  Buy Now
</button>
```

## Components

### App.svelte

Main application component with:

- Provider selection
- Email input
- Amount configuration
- Checkout button
- Error handling

### lib/api.js

API client with functions:

- `createCheckoutSession(payload)`
- `getReceipt(sessionId)`
- `createSubscription(payload)`
- `cancelSubscription(subscriptionId)`

## Styling

The app uses vanilla CSS with:

- Responsive design
- Gradient backgrounds
- Smooth transitions
- Modern UI components

Customize by editing the `<style>` section in `App.svelte`.

## Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Mobile browsers: ✅ iOS Safari, Chrome Android

## Security

- No sensitive data stored in frontend
- All payment processing on edge workers
- HTTPS required in production
- CORS properly configured

## License

MIT
