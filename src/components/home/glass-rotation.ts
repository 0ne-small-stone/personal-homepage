import { Euler, Quaternion } from 'three';
import { MotionLerper, type MotionState } from './works-motion';
import type { JourneyModel } from './scene-state';

// SYSTEM 9.2.3. The GL step is capped; Lerpers keep the shared RAF delta.
const identity = new Quaternion();
const sigmoid = (t: number) => {
  const f = (x: number) => 1 / (1 + Math.exp(-12 * (x - .5)));
  return (f(t) - f(0)) / (f(1) - f(0));
};
const settings = (phase: string) => phase === 'kv'
  ? { target: 0, base: 0, force: 2, scroll: 0, hover: 1 }
  : phase === 'works_intro' || phase === 'works'
    // Physical spectral transport needs a stable pose to converge. Keep the
    // existing scroll and pointer response; remove only the idle self-spin.
    ? { target: 1, base: 0, force: phase === 'works' ? .1 : .4, scroll: .001, hover: .2 }
    : { target: 0, base: 0, force: 2, scroll: 0, hover: 0 };

export class GlassRotation {
  readonly quaternion = new Quaternion();
  private euler = new Euler();
  private mouseQuaternion = new Quaternion();
  private yQuaternion = new Quaternion();
  private x = new MotionLerper(1);
  private y = new MotionLerper(1);
  private speed = new MotionLerper(.5);
  private transition = { value: 0, from: 0, target: 0, elapsed: 1, revision: 0 };
  private initialization = -1;
  private pointerRevision = -1;
  private suspended = false;

  step(model: JourneyModel, rawDt: number, paused: boolean, hover: boolean) {
    const dt = Math.min(rawDt, 1 / 30), config = settings(model.motion.phase);
    const pointer = model.pointer, init = model.motion.initialization;
    const resumed = this.suspended && !paused;
    let reset = '';
    if (!paused && this.initialization !== init.revision) {
      this.initialization = init.revision;
      // installWorksMotion is reinstalled on resume; its layout revision is not a new visit.
      if (!(resumed && init.reason === 'layout')) {
        this.quaternion.identity();
        Object.assign(this.transition, { value: config.target, from: config.target, target: config.target, elapsed: 1 });
        reset = init.reason;
      }
      this.align(pointer);
    }
    if (resumed) { this.align(pointer); reset ||= 'resume'; }
    this.suspended = paused;
    if (this.pointerRevision !== pointer.revision) {
      this.x.reset(pointer.x); this.y.reset(pointer.y); this.pointerRevision = pointer.revision;
    }
    const x = this.x.read(pointer.x), y = this.y.read(pointer.y);
    const residual = [pointer.x - x, pointer.y - y];
    const clampedVelocity = Math.max(-30, Math.min(30, model.motion.velocity));
    const velocity = this.speed.read(clampedVelocity);
    const before = this.quaternion.toArray();
    const eulerBefore = [this.euler.x, this.euler.y, this.euler.z], wBefore = this.transition.value;
    let weight = 0, yIncrement = 0, returnFactor = 0;
    if (!paused) {
      const transition = this.transition;
      // GL.hover precedes MainLogo.update: pointer suppression reads the old w.
      weight = pointer.active && hover ? .01 * Math.max(0, 1 - 1.5 * Math.hypot(pointer.x, pointer.y)) * config.hover : 0;
      this.euler.x -= residual[1] * weight * (1 - .7 * wBefore);
      this.euler.y += residual[0] * weight;
      if (transition.target !== config.target) {
        Object.assign(transition, { from: transition.value, target: config.target, elapsed: 0, revision: transition.revision + 1 });
      }
      transition.elapsed = Math.min(1, transition.elapsed + dt);
      transition.value = transition.from + (transition.target - transition.from) * sigmoid(transition.elapsed);
      const w = transition.value;
      this.euler.x *= 1 - dt; this.euler.y *= 1 - dt;
      this.euler.z = 0;
      this.mouseQuaternion.setFromEuler(this.euler);
      yIncrement = -dt * config.base * w - velocity * config.scroll;
      this.yQuaternion.setFromEuler(new Euler(0, yIncrement, 0));
      this.quaternion.premultiply(this.mouseQuaternion).premultiply(this.yQuaternion);
      returnFactor = dt * config.force * (1 - .8 * w);
      this.quaternion.slerp(identity, returnFactor);
      this.x.update(rawDt); this.y.update(rawDt); this.speed.update(rawDt);
    }
    return {
      dt, rawDt, paused, hover, reset, initialization: this.initialization, phase: model.motion.phase,
      pointer: { target: [pointer.x, pointer.y], current: [x, y], residual, active: pointer.active, revision: pointer.revision, weight },
      worksRotate: { ...this.transition }, wBefore, eulerBefore, euler: [this.euler.x, this.euler.y, this.euler.z],
      velocity: { raw: model.motion.velocity, clamped: clampedVelocity, current: velocity },
      yIncrement, returnFactor, before, quaternion: this.quaternion.toArray(),
    } satisfies NonNullable<MotionState['glassRotation']>;
  }

  private align(pointer: JourneyModel['pointer']) {
    this.x.reset(pointer.x); this.y.reset(pointer.y); this.speed.reset(0);
    this.pointerRevision = pointer.revision; this.euler.set(0, 0, 0);
  }
}
