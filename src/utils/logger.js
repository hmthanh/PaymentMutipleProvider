/**
 * Logger utility for edge logging and analytics
 * Provides structured logging for Cloudflare Workers
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export class Logger {
  constructor(context = {}, env = {}) {
    this.context = context;
    this.env = env;
    this.minLevel = env.LOG_LEVEL || LOG_LEVELS.INFO;
  }

  _log(level, message, data = {}) {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };

    console.log(JSON.stringify(logEntry));

    // Optionally store metrics in KV
    if (this.env.METRICS && level === 'ERROR') {
      this._incrementErrorMetric(data);
    }
  }

  async _incrementErrorMetric(data) {
    try {
      const key = `error:${data.route || 'unknown'}:${new Date().toISOString().split('T')[0]}`;
      const current = (await this.env.METRICS.get(key)) || '0';
      await this.env.METRICS.put(key, String(parseInt(current) + 1), {
        expirationTtl: 86400 * 30, // 30 days
      });
    } catch (e) {
      console.error('Failed to update metrics:', e);
    }
  }

  debug(message, data) {
    this._log('DEBUG', message, data);
  }

  info(message, data) {
    this._log('INFO', message, data);
  }

  warn(message, data) {
    this._log('WARN', message, data);
  }

  error(message, data) {
    this._log('ERROR', message, data);
  }
}

export function createLogger(request, env) {
  const context = {
    requestId: crypto.randomUUID(),
    url: request.url,
    method: request.method,
  };
  return new Logger(context, env);
}
