// Keep the existing single R3F clock alive through input, snap and settling.
// No timer/ticker runs while the actual scene is stationary.
export class FrameActivity {
  private previous: number[] = [];
  private changedAt = 0;
  private awakeUntil = 0;
  wake(now: number) { this.awakeUntil = Math.max(this.awakeUntil, now + 1200); }
  inputActive(now: number) { return now < this.awakeUntil; }
  advance(now: number, values: number[], busy: boolean) {
    if (values.length !== this.previous.length || values.some((v, i) => Math.abs(v - this.previous[i]) > 1e-6)) {
      this.changedAt = now;
      this.previous = values;
    }
    return busy || now < this.awakeUntil || now - this.changedAt < 180;
  }
}

// R3F demand delta includes idle time; never feed that pause into the lerpers.
export const activeFrameDelta = (dt: number, resuming: boolean) => resuming && dt > .25 ? 1 / 60 : dt;
