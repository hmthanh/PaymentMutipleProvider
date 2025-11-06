/**
 * Webhook signature verification utilities
 */

/**
 * Verify HMAC signature for webhook requests
 * @param {string} payload - Raw payload string
 * @param {string} signature - Signature from webhook header
 * @param {string} secret - Webhook secret
 * @param {string} algorithm - Hash algorithm (default: SHA-256)
 * @returns {Promise<boolean>}
 */
export async function verifyHmacSignature(
  payload,
  signature,
  secret,
  algorithm = 'SHA-256'
) {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign', 'verify']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Remove any prefix like 'sha256=' if present
    const cleanSignature = signature.includes('=')
      ? signature.split('=')[1]
      : signature;

    return expectedSignature === cleanSignature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Verify webhook signature using comparison
 * @param {string} received - Received signature
 * @param {string} expected - Expected signature
 * @returns {boolean}
 */
export function compareSignatures(received, expected) {
  if (!received || !expected || received.length !== expected.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < received.length; i++) {
    result |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Extract and validate timestamp from webhook to prevent replay attacks
 * @param {number} timestamp - Webhook timestamp
 * @param {number} toleranceSeconds - Maximum age in seconds (default: 5 minutes)
 * @returns {boolean}
 */
export function isTimestampValid(timestamp, toleranceSeconds = 300) {
  const currentTime = Math.floor(Date.now() / 1000);
  const difference = Math.abs(currentTime - timestamp);
  return difference <= toleranceSeconds;
}

/**
 * Parse and validate JSON webhook payload
 * @param {Request} request - Incoming webhook request
 * @returns {Promise<object>}
 */
export async function parseWebhookPayload(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      const payload = {};
      for (const [key, value] of params.entries()) {
        payload[key] = value;
      }
      return payload;
    } else {
      return await request.json();
    }
  } catch (error) {
    throw new Error(`Failed to parse webhook payload: ${error.message}`);
  }
}
