export interface MetricsCollector {
  increment(name: string, tags?: Record<string, string>): void;
  timing(name: string, durationMs: number, tags?: Record<string, string>): void;
  snapshot(): { counters: Record<string, number> };
}

export class InMemoryMetrics implements MetricsCollector {
  private readonly counters = new Map<string, number>();

  increment(name: string, tags?: Record<string, string>): void {
    const key = this.makeKey(name, tags);
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1);
  }

  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.increment(`${name}:${Math.round(durationMs)}`, tags);
  }

  snapshot() {
    return { counters: Object.fromEntries(this.counters.entries()) };
  }

  private makeKey(name: string, tags?: Record<string, string>) {
    const suffix = tags ? JSON.stringify(tags) : '';
    return `${name}${suffix}`;
  }
}
