export interface Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): { end(): void };
}

export class NoopTracer implements Tracer {
  startSpan(name: string, attributes?: Record<string, unknown>): { end(): void } {
    void name;
    void attributes;
    return { end() {} };
  }
}
