import type { Request, Response } from 'express';
import { NotFoundError } from '../infra/errors.js';
import type { SessionStore } from '../services/session-store.js';

export class SessionController {
  constructor(private readonly sessions: SessionStore) {}

  getById(req: Request, res: Response) {
    const rawSessionId = req.params.id;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
    if (!sessionId) {
      throw new NotFoundError('Session id is required');
    }
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError(`Session not found: ${sessionId}`);
    }
    res.json({ data: session });
  }
}
