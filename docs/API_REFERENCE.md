# API Reference

## Base URL

When deployed: `https://your-worker.workers.dev`

For development: `http://localhost:8787`

## Authentication

Most endpoints require API credentials configured via Wrangler secrets. Webhook endpoints verify signatures from payment providers.

## Endpoints

### Health Check

#### `GET /health`

Check if the service is running.

**Response:**

```json
{
  "success": true,
  "message": "Service is running",
  "data": {
    "status": "healthy"
  }
}
```

---

### Checkout

#### `POST /api/checkout`

Create a checkout session with a payment provider.

**Request Body:**

```json
{
  "provider": "paddle",
  "userId": "user_123",
  "email": "customer@example.com",
  "amount": 1000,
  "currency": "USD",
  "productName": "Premium Subscription",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel",
  "metadata": {
    "plan": "premium",
    "period": "monthly"
  }
}
```

**Parameters:**

- `provider` (required): Payment provider - `paddle`, `paypal`, or `stripe`
- `userId` (required): Your internal user identifier
- `email` (required): Customer's email address
- `amount` (required): Amount in cents (e.g., 1000 = $10.00)
- `currency` (optional): Currency code (default: USD)
- `productName` (required): Product or service name
- `successUrl` (optional): URL to redirect after successful payment
- `cancelUrl` (optional): URL to redirect if payment is cancelled
- `metadata` (optional): Additional custom data

**Response:**

```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "txn_abc123",
    "checkoutUrl": "https://checkout.paddle.com/...",
    "provider": "paddle"
  }
}
```

**Example Usage:**

```javascript
const response = await fetch('https://your-worker.workers.dev/api/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    provider: 'paddle',
    userId: 'user_123',
    email: 'customer@example.com',
    amount: 2999,
    currency: 'USD',
    productName: 'Annual Pro Plan',
  }),
});

const data = await response.json();
window.location.href = data.data.checkoutUrl;
```

---

### Webhook

#### `POST /api/webhook/:provider`

Receive and process webhooks from payment providers.

**Path Parameters:**

- `provider`: Payment provider name (`paddle`, `paypal`, or `stripe`)

**Headers (Provider-Specific):**

**Paddle:**

- `paddle-signature`: Webhook signature

**PayPal:**

- `paypal-transmission-id`: Transmission ID
- `paypal-transmission-time`: Transmission timestamp
- `paypal-transmission-sig`: Signature
- `paypal-cert-url`: Certificate URL
- `paypal-auth-algo`: Auth algorithm

**Request Body:**

Provider-specific webhook payload (automatically verified)

**Response:**

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "received": true
  }
}
```

**Idempotency:**

The system automatically handles duplicate webhooks. If the same event is sent multiple times, it will only be processed once.

---

### Receipt

#### `GET /api/receipt/:sessionId`

Retrieve receipt information for a payment session.

**Path Parameters:**

- `sessionId`: The checkout session ID

**Response:**

```json
{
  "success": true,
  "message": "Receipt retrieved successfully",
  "data": {
    "session": {
      "userId": "user_123",
      "provider": "paddle",
      "email": "customer@example.com",
      "amount": 1000,
      "currency": "USD",
      "productName": "Premium Subscription",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "providerDetails": {
      // Provider-specific transaction details
    }
  }
}
```

---

### Subscription

#### `POST /api/subscription`

Create a subscription.

**Request Body:**

```json
{
  "provider": "paddle",
  "userId": "user_123",
  "email": "customer@example.com",
  "priceId": "pri_123",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

**Parameters:**

- `provider` (required): Payment provider
- `userId` (required): Your internal user identifier
- `email` (required): Customer's email
- `priceId` or `planId` (required): Provider's price/plan identifier
- `successUrl` (optional): Success redirect URL
- `cancelUrl` (optional): Cancel redirect URL

**Response:**

```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscriptionId": "sub_abc123",
    "checkoutUrl": "https://checkout.paddle.com/...",
    "provider": "paddle"
  }
}
```

#### `DELETE /api/subscription/:subscriptionId`

Cancel a subscription.

**Path Parameters:**

- `subscriptionId`: The subscription ID

**Response:**

```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "status": "cancelled",
    "subscriptionId": "sub_abc123"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "details": {
    // Additional error details (optional)
  }
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found
- `500` - Internal Server Error

---

## CORS

All endpoints include CORS headers:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Rate Limiting

Rate limiting can be implemented using Cloudflare's built-in rate limiting rules. Recommended limits:

- Checkout: 10 requests per minute per IP
- Webhooks: 100 requests per minute per provider
- Receipt: 30 requests per minute per IP

---

## Webhook Events

### Paddle Events

Common webhook events:

- `transaction.completed` - Payment completed successfully
- `transaction.updated` - Transaction details updated
- `subscription.created` - Subscription created
- `subscription.updated` - Subscription updated
- `subscription.cancelled` - Subscription cancelled

### PayPal Events

Common webhook events:

- `PAYMENT.CAPTURE.COMPLETED` - Payment captured
- `PAYMENT.CAPTURE.DENIED` - Payment denied
- `BILLING.SUBSCRIPTION.CREATED` - Subscription created
- `BILLING.SUBSCRIPTION.CANCELLED` - Subscription cancelled
- `BILLING.SUBSCRIPTION.UPDATED` - Subscription updated

---

## Testing

Use the following test credentials for sandbox environments:

**Paddle Sandbox:**

- Set `PADDLE_SANDBOX=true` in environment variables
- Use Paddle's sandbox dashboard for test API keys

**PayPal Sandbox:**

- Set `PAYPAL_SANDBOX=true` in environment variables
- Use PayPal Developer dashboard for sandbox credentials

---

## Best Practices

1. **Always handle errors**: Check for `success: false` in responses
2. **Store session IDs**: Save the returned `sessionId` for future reference
3. **Verify amounts**: Always verify payment amounts on your backend
4. **Use HTTPS**: Never send payment data over unencrypted connections
5. **Implement timeouts**: Set reasonable timeouts for API calls
6. **Log everything**: Enable comprehensive logging for debugging

---

## Support

For issues or questions:

1. Check the documentation in `/docs/`
2. Review test files in `/src/tests/`
3. Consult provider-specific documentation:
   - [Paddle API Docs](https://developer.paddle.com/)
   - [PayPal API Docs](https://developer.paypal.com/)
   - [Stripe API Docs](https://stripe.com/docs/api)
