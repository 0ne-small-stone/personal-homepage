// SYSTEM 9.2: source coordinates are converted uniformly to the existing scene.
import type { MotionChannel } from './motion-ranges';
export { introGap, motionRange, workCount } from './motion-ranges';
export type { MotionChannel } from './motion-ranges';

export const sceneUnitScale = .6;
export interface MotionState {
  height: number;
  scrollY: number;
  velocity: number;
  phase: string;
  raw: Record<MotionChannel, number>;
  rendered: { progress: number; index: number; background: number; intro: number; prepare: number; expand: number; wall: number };
  activeItem: number;
  snapActive: boolean;
  portalCovered: boolean;
  frame: number;
  time: number;
  initialization: { revision: number; y: number; zoom: number; reason: string };
  cards: { index: number; position: number[]; rotationY: number; scale: number; alpha: number; visible: boolean }[];
  camera: { position: number[]; fov: number; outro?: { raw: number; parallax: number; projection: number }; offset?: number[]; offsetTarget?: number[]; projection?: number[]; inverse?: number[]; perspective?: number[]; orthographic?: number[] } | null;
  glass: { anchor: number[]; quaternion: number[]; scale: number; visible?: boolean; projectedAnchor: number[]; bounds: number[]; centeredLocalBounds: number[] } | null;
  wall: { raw: number; rise: number; build: number; position: number[]; visible: boolean; revision: number; settled:number;falling:number;drawn:number;rows:number;samples:{id:number;row:number;column:number;x:number;y:number;progress:number}[] } | null;
  portal: { prepare: number; renderedPrepare: number; expand: number; renderedExpand: number; wall: number; renderedWall: number; build:number;sampleRevision:number;target: number[]; targetReady: boolean; hdr: boolean; homographyValid: boolean; frontCoversCorners: boolean; quad: number[][]; coversCorners: boolean; error: string | null } | null;
  glassRotation: {
    dt: number; rawDt: number; paused: boolean; hover: boolean; reset: string; initialization: number; phase: string;
    pointer: { target: number[]; current: number[]; residual: number[]; active: boolean; revision: number; weight: number };
    worksRotate: { value: number; from: number; target: number; elapsed: number; revision: number };
    wBefore: number; eulerBefore: number[]; euler: number[]; velocity: { raw: number; clamped: number; current: number };
    yIncrement: number; returnFactor: number; before: number[]; quaternion: number[];
  } | null;
}

export function createMotionState(): MotionState {
  return {
    height: 900, scrollY: 0, velocity: 0, phase: 'kv',
    raw: { kv: 0, intro: 0, works: 0, event: 0, snap: 0, outro: 0, prepare: 0, expand: 0, wall: 0 },
    rendered: { progress: 0, index: 0, background: 0, intro: 0, prepare: 0, expand: 0, wall: 0 },
    activeItem: -1, snapActive: false, portalCovered: false, frame: 0, time: 0,
    initialization: { revision: 0, y: 0, zoom: 1, reason: 'pending' }, cards: [], camera: null, glass: null, wall: null, portal: null, glassRotation: null,
  };
}

// The source reads the previous current, then updates all Lerpers AFTER scene transforms.
export class MotionLerper {
  private current: number | undefined;
  private target = 0;
  constructor(private multiplier: number) {}
  reset(value: number) { this.current = this.target = value; }
  snapshot() { return { current: this.current, target: this.target }; }
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
