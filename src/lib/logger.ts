import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'email',
      'password',
      'token',
      'api_key',
      'apiKey',
      'x-api-key',
      'authorization',
      'Authorization',
      '*.email',
      '*.password',
      '*.token',
      '*.api_key',
      '*.apiKey',
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'body.email',
      'body.password',
      'body.token',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'yeoskin-finance',
    env: process.env.NODE_ENV || 'development',
  },
});

export type Logger = typeof logger;
