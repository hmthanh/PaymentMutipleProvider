# Deployment Guide

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Payment provider accounts (Paddle, PayPal)

## Step 1: Configure KV Namespaces

Create the required KV namespaces:

```bash
# Create production namespaces
wrangler kv:namespace create "SESSIONS"
wrangler kv:namespace create "EVENTS"
wrangler kv:namespace create "METRICS"

# Create preview namespaces
wrangler kv:namespace create "SESSIONS" --preview
wrangler kv:namespace create "EVENTS" --preview
wrangler kv:namespace create "METRICS" --preview
```

Update the IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "<your-sessions-id>"
preview_id = "<your-sessions-preview-id>"

[[kv_namespaces]]
binding = "EVENTS"
id = "<your-events-id>"
preview_id = "<your-events-preview-id>"

[[kv_namespaces]]
binding = "METRICS"
id = "<your-metrics-id>"
preview_id = "<your-metrics-preview-id>"
```

## Step 2: Set Secrets

Set all required secrets using Wrangler:

```bash
# Paddle secrets
wrangler secret put PADDLE_API_KEY
wrangler secret put PADDLE_WEBHOOK_SECRET

# PayPal secrets
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
wrangler secret put PAYPAL_WEBHOOK_ID

# Stripe secrets (when implementing)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# Internal secrets
wrangler secret put INTERNAL_SECRET
```

## Step 3: Configure Environment Variables

Update `wrangler.toml` with your values:

```toml
[vars]
ENVIRONMENT = "production"
INTERNAL_BACKEND_URL = "https://your-backend.com"
```

## Step 4: Deploy Worker

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Your worker will be deployed to:
`https://payment-system.<your-subdomain>.workers.dev`

## Step 5: Configure Webhooks

Set up webhooks in each payment provider:

### Paddle

1. Go to Paddle Dashboard → Developer Tools → Notifications
2. Add webhook URL: `https://payment-system.<your-subdomain>.workers.dev/api/webhook/paddle`
3. Select events to receive
4. Save the webhook secret in `PADDLE_WEBHOOK_SECRET`

### PayPal

1. Go to PayPal Developer Dashboard → Webhooks
2. Create webhook: `https://payment-system.<your-subdomain>.workers.dev/api/webhook/paypal`
3. Select event types
4. Save the webhook ID in `PAYPAL_WEBHOOK_ID`

### Stripe (when implementing)

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://payment-system.<your-subdomain>.workers.dev/api/webhook/stripe`
3. Select events
4. Save the signing secret in `STRIPE_WEBHOOK_SECRET`

## Step 6: Deploy Frontend

### Option 1: Cloudflare Pages

```bash
cd frontend/svelte
npm install
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist
```

Set environment variable in Pages:

- `VITE_API_URL`: `https://payment-system.<your-subdomain>.workers.dev`

### Option 2: Custom Hosting

Build and deploy to your hosting provider:

```bash
cd frontend/svelte
npm install
VITE_API_URL=https://your-worker-url npm run build
# Deploy dist/ folder to your hosting
```

## Step 7: Test the Deployment

### Test health endpoint:

```bash
curl https://payment-system.<your-subdomain>.workers.dev/health
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

### Test checkout endpoint:

```bash
curl -X POST https://payment-system.<your-subdomain>.workers.dev/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "paddle",
    "userId": "test_user",
    "email": "test@example.com",
    "amount": 1000,
    "currency": "USD",
    "productName": "Test Product"
  }'
```

## Step 8: Monitor and Debug

### View logs:

```bash
wrangler tail
```

### Check metrics:

Use the Cloudflare Dashboard → Workers → Analytics

### Debug issues:

1. Check Wrangler logs
2. Verify all secrets are set
3. Confirm KV namespace IDs are correct
4. Test webhook signatures with provider tools

## Production Checklist

- [ ] All KV namespaces created and configured
- [ ] All secrets set via Wrangler
- [ ] Environment variables updated in wrangler.toml
- [ ] Worker deployed successfully
- [ ] Webhooks configured in all providers
- [ ] Frontend deployed and connected to worker
- [ ] Health endpoint returns 200
- [ ] Test checkout flow end-to-end
- [ ] Test webhook delivery
- [ ] Monitor logs for errors
- [ ] Set up alerting for critical errors

## Updating the Worker

To update after making changes:

```bash
# Run tests
npm test

# Deploy update
npm run deploy

# Verify deployment
curl https://your-worker-url/health
```

## Rollback

If you need to rollback:

```bash
# Deploy a specific version
wrangler deploy --version <version-id>
```

## Custom Domain (Optional)

Set up a custom domain:

1. Go to Cloudflare Dashboard → Workers → your worker
2. Click "Triggers" → "Add Custom Domain"
3. Enter your domain (e.g., `payments.yourdomain.com`)
4. Update frontend `VITE_API_URL` to use custom domain

## Security Considerations

1. **Secrets**: Never commit secrets to version control
2. **CORS**: Restrict origins in production if needed
3. **Rate Limiting**: Set up Cloudflare rate limiting rules
4. **Monitoring**: Enable alerts for failed webhooks
5. **Audit**: Regularly review KV storage and metrics

## Cost Optimization

- Cloudflare Workers Free Tier: 100,000 requests/day
- KV Free Tier: 100,000 reads/day, 1,000 writes/day
- Monitor usage in Cloudflare Dashboard

For high-volume applications, consider:

- Caching strategies
- Batching KV operations
- Upgrading to Workers Paid plan

## Support

For deployment issues:

- Check Cloudflare Workers documentation
- Review Wrangler logs
- Contact Cloudflare support
- Open an issue on GitHub

## Next Steps

After deployment:

1. Set up monitoring and alerting
2. Configure custom domain
3. Implement retry logic for failed webhooks
4. Add more payment providers
5. Create dashboard for metrics
