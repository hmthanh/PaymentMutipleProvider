/**
 * Cloudflare KV helpers for session and event management
 */

/**
 * Store session data in KV
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} sessionId - Unique session identifier
 * @param {object} data - Session data to store
 * @param {number} ttl - Time to live in seconds (default: 1 hour)
 */
export async function storeSession(kv, sessionId, data, ttl = 3600) {
  const key = `session:${sessionId}`;
  await kv.put(key, JSON.stringify(data), {
    expirationTtl: ttl,
  });
}

/**
 * Retrieve session data from KV
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<object|null>} Session data or null if not found
 */
export async function getSession(kv, sessionId) {
  const key = `session:${sessionId}`;
  const data = await kv.get(key, 'json');
  return data;
}

/**
 * Delete session from KV
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} sessionId - Unique session identifier
 */
export async function deleteSession(kv, sessionId) {
  const key = `session:${sessionId}`;
  await kv.delete(key);
}

/**
 * Check if an event has already been processed (idempotency)
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} provider - Payment provider name
 * @param {string} eventId - Event identifier
 * @returns {Promise<boolean>} True if event already processed
 */
export async function isEventProcessed(kv, provider, eventId) {
  const key = `evt:${provider}:${eventId}`;
  const exists = await kv.get(key);
  return exists !== null;
}

/**
 * Mark an event as processed
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} provider - Payment provider name
 * @param {string} eventId - Event identifier
 * @param {object} data - Event data to store
 * @param {number} ttl - Time to live in seconds (default: 7 days)
 */
export async function markEventProcessed(kv, provider, eventId, data = {}, ttl = 604800) {
  const key = `evt:${provider}:${eventId}`;
  await kv.put(
    key,
    JSON.stringify({
      processed_at: new Date().toISOString(),
      ...data,
    }),
    {
      expirationTtl: ttl,
    }
  );
}

/**
 * Increment a counter in KV
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} counterKey - Counter key
 * @param {number} ttl - Time to live in seconds
 */
export async function incrementCounter(kv, counterKey, ttl = 86400) {
  const current = (await kv.get(counterKey)) || '0';
  const newValue = String(parseInt(current) + 1);
  await kv.put(counterKey, newValue, { expirationTtl: ttl });
  return parseInt(newValue);
}
