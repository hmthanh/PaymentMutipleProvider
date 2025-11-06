/**
 * Router for handling API endpoints
 * Defines routes for checkout, webhooks, receipts, and subscriptions
 */

import { getProviderAdapter } from './adapters/providerAdapter.js';
import { storeSession, getSession, isEventProcessed, markEventProcessed, incrementCounter } from './utils/kv.js';
import { successResponse, errorResponse, corsResponse } from './utils/response.js';

/**
 * Handle checkout endpoint: POST /api/checkout
 */
export async function handleCheckout(request, env, logger) {
  try {
    const body = await request.json();
    const { 
      provider, 
      userId, 
      email, 
      amount, 
      currency, 
      productName, 
      successUrl, 
      cancelUrl,
      metadata 
    } = body;

    // Validate required fields
    if (!provider || !userId || !email || !amount || !productName) {
      return errorResponse('Missing required fields', 400);
    }

    // Get the appropriate provider adapter
    const adapter = await getProviderAdapter(provider, env, logger);

    // Create checkout session
    const session = await adapter.createCheckoutSession({
      userId,
      email,
      amount,
      currency: currency || 'USD',
      productName,
      successUrl: successUrl || `${env.INTERNAL_BACKEND_URL}/payment/success`,
      cancelUrl: cancelUrl || `${env.INTERNAL_BACKEND_URL}/payment/cancel`,
      metadata,
    });

    // Store session metadata in KV
    await storeSession(env.SESSIONS, session.sessionId, {
      userId,
      provider,
      email,
      amount,
      currency,
      productName,
      createdAt: new Date().toISOString(),
    });

    // Increment metrics
    await incrementCounter(
      env.METRICS,
      `checkout:${provider}:${new Date().toISOString().split('T')[0]}`
    );

    logger.info('Checkout session created', {
      sessionId: session.sessionId,
      provider,
      userId,
    });

    return successResponse(session, 'Checkout session created successfully');
  } catch (error) {
    logger.error('Checkout error', { error: error.message });
    return errorResponse(error.message, 500);
  }
}

/**
 * Handle webhook endpoint: POST /api/webhook/:provider
 */
export async function handleWebhook(request, env, logger, provider) {
  try {
    // Get the appropriate provider adapter
    const adapter = await getProviderAdapter(provider, env, logger);

    // Verify webhook signature and extract event data
    const event = await adapter.verifyWebhook(request);

    // Check idempotency - ensure we haven't processed this event before
    const alreadyProcessed = await isEventProcessed(env.EVENTS, provider, event.eventId);
    
    if (alreadyProcessed) {
      logger.info('Event already processed (idempotent)', {
        provider,
        eventId: event.eventId,
      });
      return successResponse({ received: true }, 'Event already processed');
    }

    // Mark event as processed
    await markEventProcessed(env.EVENTS, provider, event.eventId, {
      eventType: event.eventType,
      processedAt: new Date().toISOString(),
    });

    // Forward to internal backend for persistence and processing
    try {
      const backendResponse = await fetch(
        `${env.INTERNAL_BACKEND_URL}/internal/payment/notify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': env.INTERNAL_SECRET || '',
          },
          body: JSON.stringify({
            provider,
            event: event.eventType,
            eventId: event.eventId,
            data: event.data,
            rawPayload: event.rawPayload,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!backendResponse.ok) {
        logger.warn('Backend notification failed', {
          status: backendResponse.status,
          provider,
          eventId: event.eventId,
        });
        // Don't fail the webhook - we've already marked it as processed
        // Implement retry logic separately if needed
      }
    } catch (backendError) {
      logger.error('Failed to notify backend', {
        error: backendError.message,
        provider,
        eventId: event.eventId,
      });
      // Continue - don't fail the webhook response
    }

    // Increment webhook metrics
    await incrementCounter(
      env.METRICS,
      `webhook:${provider}:${event.eventType}:${new Date().toISOString().split('T')[0]}`
    );

    logger.info('Webhook processed successfully', {
      provider,
      eventId: event.eventId,
      eventType: event.eventType,
    });

    return successResponse({ received: true }, 'Webhook processed successfully');
  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      provider,
    });
    return errorResponse(error.message, 400);
  }
}

/**
 * Handle receipt endpoint: GET /api/receipt/:sessionId
 */
export async function handleReceipt(request, env, logger, sessionId) {
  try {
    // Retrieve session from KV
    const session = await getSession(env.SESSIONS, sessionId);

    if (!session) {
      return errorResponse('Session not found', 404);
    }

    // Get provider details if needed
    const adapter = await getProviderAdapter(session.provider, env, logger);
    const providerSession = await adapter.getSession(sessionId);

    logger.info('Receipt retrieved', {
      sessionId,
      provider: session.provider,
    });

    return successResponse({
      session,
      providerDetails: providerSession,
    }, 'Receipt retrieved successfully');
  } catch (error) {
    logger.error('Receipt retrieval error', {
      error: error.message,
      sessionId,
    });
    return errorResponse(error.message, 500);
  }
}

/**
 * Handle subscription creation: POST /api/subscription
 */
export async function handleSubscriptionCreate(request, env, logger) {
  try {
    const body = await request.json();
    const { 
      provider, 
      userId, 
      email, 
      planId, 
      priceId,
      successUrl, 
      cancelUrl 
    } = body;

    // Validate required fields
    if (!provider || !userId || !email || (!planId && !priceId)) {
      return errorResponse('Missing required fields', 400);
    }

    // Get the appropriate provider adapter
    const adapter = await getProviderAdapter(provider, env, logger);

    // Create subscription
    const subscription = await adapter.createSubscription({
      userId,
      email,
      planId,
      priceId,
      successUrl: successUrl || `${env.INTERNAL_BACKEND_URL}/payment/success`,
      cancelUrl: cancelUrl || `${env.INTERNAL_BACKEND_URL}/payment/cancel`,
    });

    // Store subscription metadata in KV
    await storeSession(env.SESSIONS, subscription.subscriptionId, {
      userId,
      provider,
      email,
      type: 'subscription',
      planId: planId || priceId,
      createdAt: new Date().toISOString(),
    }, 86400 * 30); // 30 days TTL

    logger.info('Subscription created', {
      subscriptionId: subscription.subscriptionId,
      provider,
      userId,
    });

    return successResponse(subscription, 'Subscription created successfully');
  } catch (error) {
    logger.error('Subscription creation error', { error: error.message });
    return errorResponse(error.message, 500);
  }
}

/**
 * Handle subscription cancellation: DELETE /api/subscription/:subscriptionId
 */
export async function handleSubscriptionCancel(request, env, logger, subscriptionId) {
  try {
    // Retrieve subscription from KV to get provider
    const subscription = await getSession(env.SESSIONS, subscriptionId);

    if (!subscription) {
      return errorResponse('Subscription not found', 404);
    }

    // Get the appropriate provider adapter
    const adapter = await getProviderAdapter(subscription.provider, env, logger);

    // Cancel subscription
    const result = await adapter.cancelSubscription(subscriptionId);

    logger.info('Subscription cancelled', {
      subscriptionId,
      provider: subscription.provider,
    });

    return successResponse(result, 'Subscription cancelled successfully');
  } catch (error) {
    logger.error('Subscription cancellation error', {
      error: error.message,
      subscriptionId,
    });
    return errorResponse(error.message, 500);
  }
}

/**
 * Main router function
 */
export async function route(request, env, logger) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return corsResponse();
  }

  // Route matching
  if (path === '/api/checkout' && method === 'POST') {
    return handleCheckout(request, env, logger);
  }

  if (path.startsWith('/api/webhook/') && method === 'POST') {
    const provider = path.split('/')[3];
    return handleWebhook(request, env, logger, provider);
  }

  if (path.startsWith('/api/receipt/') && method === 'GET') {
    const sessionId = path.split('/')[3];
    return handleReceipt(request, env, logger, sessionId);
  }

  if (path === '/api/subscription' && method === 'POST') {
    return handleSubscriptionCreate(request, env, logger);
  }

  if (path.startsWith('/api/subscription/') && method === 'DELETE') {
    const subscriptionId = path.split('/')[3];
    return handleSubscriptionCancel(request, env, logger, subscriptionId);
  }

  // Health check endpoint
  if (path === '/health' && method === 'GET') {
    return successResponse({ status: 'healthy' }, 'Service is running');
  }

  // Not found
  return errorResponse('Endpoint not found', 404);
}
