export class Timer {
  private start = Date.now();
  private marks: { label: string; time: number }[] = [];

  mark(label: string) {
    this.marks.push({ label, time: Date.now() });
  }

  log(routeName: string) {
    let prev = this.start;
    const parts = this.marks.map((m) => {
      const delta = m.time - prev;
      prev = m.time;
      return `${m.label}=${delta}ms`;
    });
    const total = Date.now() - this.start;
    console.log(`[TIMING] ${routeName} | ${parts.join(" | ")} | TOTAL=${total}ms`);
  }
}
