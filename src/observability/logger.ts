import pino from 'pino';
import pinoHttpImport from 'pino-http';
import type { IncomingMessage } from 'http';
import type { RequestHandler } from 'express';

const pinoHttp = pinoHttpImport as unknown as (options: {
  logger: pino.Logger;
  genReqId: (req: IncomingMessage) => string;
  customSuccessMessage: () => string;
  customErrorMessage: () => string;
}) => RequestHandler;

export function createLogger(level: string) {
  return pino({ level, base: null });
}

export function createHttpLogger(logger: pino.Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: (req: IncomingMessage) => {
      const header = req.headers['x-correlation-id'];
      if (Array.isArray(header)) {
        return header[0] ?? crypto.randomUUID();
      }
      return header ?? crypto.randomUUID();
    },
    customSuccessMessage: () => 'request completed',
    customErrorMessage: () => 'request errored'
  });
}
