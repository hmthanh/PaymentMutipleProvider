/**
 * Main Cloudflare Worker entrypoint
 * Handles incoming requests and routes them appropriately
 */

import { route } from './router.js';
import { createLogger } from './utils/logger.js';
import { errorResponse } from './utils/response.js';

/**
 * Fetch handler - main entry point for Cloudflare Worker
 */
export default {
  async fetch(request, env, ctx) {
    // Create logger for this request
    const logger = createLogger(request, env);

    try {
      logger.info('Request received', {
        method: request.method,
        url: request.url,
      });

      // Route the request
      const response = await route(request, env, logger);

      logger.info('Request completed', {
        status: response.status,
      });

      return response;
    } catch (error) {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
      });

      return errorResponse('Internal server error', 500, {
        message: error.message,
      });
    }
  },

  /**
   * Scheduled handler for cron jobs (optional)
   * Can be used for cleanup, metrics aggregation, etc.
   */
  async scheduled(event, env, ctx) {
    const logger = createLogger({ url: 'cron', method: 'CRON' }, env);

    logger.info('Scheduled task running', {
      cron: event.cron,
      scheduledTime: event.scheduledTime,
    });

    // Example: Clean up old sessions or aggregate metrics
    // Implementation depends on specific needs
  },
};
