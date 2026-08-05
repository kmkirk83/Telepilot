import type { QueueJob } from '../types/domain.js';
import { ValidationError } from './errors.js';

export interface QueueHandler<T> {
  (job: QueueJob<T>): Promise<void>;
}

export class InMemoryQueue<T> {
  private readonly jobs: QueueJob<T>[] = [];
  private readonly deadLetter: QueueJob<T>[] = [];
  private readonly handlers: Array<QueueHandler<T>> = [];

  constructor(
    private readonly maxRetries: number,
    private readonly backoffMs: number
  ) {}

  registerHandler(handler: QueueHandler<T>) {
    this.handlers.push(handler);
  }

  enqueue(job: QueueJob<T>) {
    this.jobs.push(job);
    queueMicrotask(() => {
      void this.processNext();
    });
  }

  getPendingCount() {
    return this.jobs.length;
  }

  getDeadLetterCount() {
    return this.deadLetter.length;
  }

  getDeadLetters() {
    return [...this.deadLetter];
  }

  async drain() {
    while (this.jobs.length > 0) {
      await this.processNext();
    }
  }

  private async processNext() {
    const job = this.jobs.shift();
    if (!job) {
      return;
    }

    for (const handler of this.handlers) {
      try {
        await handler(job);
        return;
      } catch (error) {
        if (error instanceof ValidationError) {
          this.deadLetter.push(job);
          return;
        }
        if (job.attempts >= this.maxRetries) {
          this.deadLetter.push(job);
          return;
        }
        const nextAttempt = { ...job, attempts: job.attempts + 1 };
        await new Promise((resolve) => setTimeout(resolve, this.backoffMs * nextAttempt.attempts));
        this.jobs.push(nextAttempt);
        queueMicrotask(() => {
          void this.processNext();
        });
        return;
      }
    }
  }
}
