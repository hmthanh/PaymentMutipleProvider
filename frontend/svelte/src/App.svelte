<script>
  import { createCheckoutSession } from './lib/api.js';

  // Reactive state
  let selectedProvider = $state('paddle');
  let email = $state('');
  let amount = $state(2999);
  let productName = $state('Premium Plan');
  let loading = $state(false);
  let error = $state('');

  const providers = [
    { id: 'paddle', name: 'Paddle', enabled: true },
    { id: 'paypal', name: 'PayPal', enabled: true },
    { id: 'stripe', name: 'Stripe', enabled: false },
  ];

  async function handleCheckout() {
    if (!email) {
      error = 'Please enter your email';
      return;
    }

    loading = true;
    error = '';

    try {
      const response = await createCheckoutSession({
        provider: selectedProvider,
        userId: `user_${Date.now()}`,
        email: email,
        amount: amount,
        currency: 'USD',
        productName: productName,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
        metadata: {
          source: 'demo',
        },
      });

      if (response.success && response.data.checkoutUrl) {
        // Redirect to checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        error = 'Failed to create checkout session';
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function formatPrice(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }
</script>

<main>
  <div class="container">
    <header>
      <h1>💳 Payment System Demo</h1>
      <p>Cloudflare Workers Edge Payment Orchestrator</p>
    </header>

    <div class="payment-card">
      <h2>Checkout</h2>

      <div class="form-group">
        <label for="provider">Payment Provider</label>
        <div class="provider-buttons">
          {#each providers as provider}
            <button
              class="provider-btn"
              class:active={selectedProvider === provider.id}
              class:disabled={!provider.enabled}
              disabled={!provider.enabled}
              onclick={() => (selectedProvider = provider.id)}
            >
              {provider.name}
              {#if !provider.enabled}
                <span class="badge">Coming Soon</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          bind:value={email}
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="product">Product</label>
        <input
          id="product"
          type="text"
          bind:value={productName}
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="amount">Amount</label>
        <div class="amount-input">
          <span class="currency">$</span>
          <input
            id="amount"
            type="number"
            step="0.01"
            value={amount / 100}
            oninput={(e) => (amount = Math.round(e.target.value * 100))}
            disabled={loading}
          />
        </div>
        <small>Total: {formatPrice(amount)}</small>
      </div>

      {#if error}
        <div class="error-message">
          ⚠️ {error}
        </div>
      {/if}

      <button
        class="checkout-btn"
        onclick={handleCheckout}
        disabled={loading || !email}
      >
        {#if loading}
          Processing...
        {:else}
          Pay {formatPrice(amount)} with {selectedProvider}
        {/if}
      </button>

      <div class="info">
        <p>
          <strong>Test Mode:</strong> This is a demo using sandbox credentials.
          No real charges will be made.
        </p>
      </div>
    </div>

    <div class="features">
      <h3>Features</h3>
      <ul>
        <li>✅ Multiple payment provider support (Paddle, PayPal, Stripe)</li>
        <li>✅ Edge-deployed on Cloudflare Workers</li>
        <li>✅ Webhook verification and idempotency</li>
        <li>✅ Session management with KV storage</li>
        <li>✅ Real-time metrics and logging</li>
        <li>✅ Secure signature verification</li>
      </ul>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
      Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  header {
    text-align: center;
    color: white;
    margin-bottom: 2rem;
  }

  h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
  }

  header p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin: 0;
  }

  .payment-card {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }

  input[type='email'],
  input[type='text'],
  input[type='number'] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .provider-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .provider-btn {
    flex: 1;
    min-width: 120px;
    padding: 0.75rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
  }

  .provider-btn:hover:not(:disabled) {
    border-color: #667eea;
    background: #f8f9ff;
  }

  .provider-btn.active {
    border-color: #667eea;
    background: #667eea;
    color: white;
  }

  .provider-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .badge {
    display: block;
    font-size: 0.7rem;
    font-weight: normal;
    margin-top: 0.25rem;
  }

  .amount-input {
    position: relative;
    display: flex;
    align-items: center;
  }

  .currency {
    position: absolute;
    left: 0.75rem;
    font-weight: 600;
    color: #666;
  }

  .amount-input input {
    padding-left: 2rem;
  }

  small {
    display: block;
    margin-top: 0.25rem;
    color: #666;
    font-size: 0.9rem;
  }

  .checkout-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s, opacity 0.3s;
  }

  .checkout-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .checkout-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .checkout-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error-message {
    padding: 0.75rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    color: #c33;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .info {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #f8f9ff;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .info p {
    margin: 0;
    color: #666;
  }

  .features {
    margin-top: 2rem;
    color: white;
  }

  .features h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }

  .features ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .features li {
    padding: 0.5rem 0;
    font-size: 0.95rem;
    opacity: 0.9;
  }

  @media (max-width: 640px) {
    .container {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    .payment-card {
      padding: 1.5rem;
    }

    .provider-btn {
      min-width: 100px;
      font-size: 0.85rem;
    }
  }
</style>
