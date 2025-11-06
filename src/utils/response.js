/**
 * Unified response handler for consistent API responses
 */

/**
 * Create a JSON response with CORS headers
 * @param {object} data - Response data
 * @param {number} status - HTTP status code
 * @param {object} headers - Additional headers
 * @returns {Response}
 */
export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

/**
 * Create a success response
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @returns {Response}
 */
export function successResponse(data, message = 'Success') {
  return jsonResponse({
    success: true,
    message,
    data,
  });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {object} details - Additional error details
 * @returns {Response}
 */
export function errorResponse(message, status = 400, details = {}) {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...details,
    },
    status
  );
}

/**
 * Handle CORS preflight requests
 * @returns {Response}
 */
export function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Create a redirect response
 * @param {string} url - Redirect URL
 * @returns {Response}
 */
export function redirectResponse(url) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
    },
  });
}
