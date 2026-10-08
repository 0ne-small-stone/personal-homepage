// SYSTEM 9.2: source coordinates are converted uniformly to the existing scene.
export const workCount = 4;
export const sceneUnitScale = .6;
export const introGap = 100;

export type MotionChannel = 'kv' | 'intro' | 'works' | 'event' | 'snap' | 'outro' | 'wall';
export interface MotionState {
  height: number;
  scrollY: number;
  velocity: number;
  phase: string;
  raw: Record<MotionChannel, number>;
  rendered: { progress: number; index: number; background: number; intro: number };
  activeItem: number;
  snapActive: boolean;
  frame: number;
  time: number;
  cards: { index: number; position: number[]; rotationY: number; scale: number; alpha: number; visible: boolean }[];
  camera: { position: number[]; fov: number } | null;
  glass: { anchor: number[]; quaternion: number[]; scale: number; projectedAnchor: number[]; bounds: number[]; centeredLocalBounds: number[] } | null;
}

export function motionRange(channel: MotionChannel, height: number): [number, number] {
  const h = height, g = introGap, n = workCount;
  return {
    kv: [-h, g], intro: [g, h + g], works: [h + g, (n + 2) * h + g],
    event: [h + g, (n + 1) * h + g], snap: [2 * h + g, (n + 1) * h + g],
    outro: [(n + 1) * h + g, (n + 2.5) * h + g],
    wall: [(n + 2.5) * h + g, (n + 3.5) * h + g],
  }[channel] as [number, number];
}

export function createMotionState(): MotionState {
  return {
    height: 900, scrollY: 0, velocity: 0, phase: 'kv',
    raw: { kv: 0, intro: 0, works: 0, event: 0, snap: 0, outro: 0, wall: 0 },
    rendered: { progress: 0, index: 0, background: 0, intro: 0 },
    activeItem: -1, snapActive: false, frame: 0, time: 0, cards: [], camera: null, glass: null,
  };
}

// The source reads the previous current, then updates all Lerpers AFTER scene transforms.
export class MotionLerper {
  private current: number | undefined;
  private target = 0;
  constructor(private multiplier: number) {}
  read(target: number) {
    this.target = target;
    this.current ??= target;
    return this.current;
  }
  update(dt: number) {
    if (this.current !== undefined) {
      const delta = this.target - this.current;
      // Avoid an asymptotic floating point tail holding round() on the wrong side.
      // For works progress this tolerance is <.005px at H=900, N=4.
      this.current = Math.abs(delta) < 1e-6 ? this.target : this.current + delta * Math.min(1, dt * 10 * this.multiplier);
    }
  }
}
