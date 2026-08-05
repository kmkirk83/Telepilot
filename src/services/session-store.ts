import type { CanonicalMessage, DispatchResult, SessionRecord } from '../types/domain.js';

export class SessionStore {
  private readonly sessions = new Map<string, SessionRecord>();

  append(message: CanonicalMessage, result?: DispatchResult) {
    const current = this.sessions.get(message.sessionId) ?? {
      id: message.sessionId,
      tenantId: message.tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    current.messages.push({
      id: message.id,
      text: message.text,
      source: message.source,
      outputText: result?.outputText
    });
    current.updatedAt = new Date().toISOString();
    this.sessions.set(current.id, current);
    return current;
  }

  get(sessionId: string) {
    return this.sessions.get(sessionId);
  }
}
