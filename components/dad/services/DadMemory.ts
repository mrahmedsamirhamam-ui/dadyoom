export default class DadMemory {
  private readonly key = "dadyoom.dad.memory.v3";

  get(name: string): string | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(this.key);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw) as Record<string, string>;
      return data[name] ?? null;
    } catch {
      return null;
    }
  }

  set(name: string, value: string): void {
    if (typeof window === "undefined") return;

    let data: Record<string, string> = {};
    try {
      data = JSON.parse(window.localStorage.getItem(this.key) ?? "{}") as Record<string, string>;
    } catch {}

    data[name] = value;
    window.localStorage.setItem(this.key, JSON.stringify(data));
  }

  clear(): void {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(this.key);
    }
  }
}
