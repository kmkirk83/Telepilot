import type { Request, Response } from 'express';

export interface QueueHealth {
  getPendingCount(): number;
  getDeadLetterCount(): number;
}

export class HealthController {
  constructor(private readonly queue: QueueHealth) {}

  live(_req: Request, res: Response) {
    res.json({ status: 'ok' });
  }

  ready(_req: Request, res: Response) {
    res.json({
      status: 'ready',
      checks: {
        queuePending: this.queue.getPendingCount(),
        deadLetterCount: this.queue.getDeadLetterCount()
      }
    });
  }
}
