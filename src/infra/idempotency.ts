export class IdempotencyStore {
  private readonly seen = new Set<string>();

  has(key: string): boolean {
    return this.seen.has(key);
  }

  add(key: string): void {
    this.seen.add(key);
  }
}
