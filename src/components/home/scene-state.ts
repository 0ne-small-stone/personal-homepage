import { createMotionState, type MotionState } from './works-motion';
import type {WallStageProbe} from './wall-stage-probe';
export interface JourneyModel {
  progress: number;
  pointer: { x: number; y: number; active: boolean; revision: number; movedAt:number; buttons:number; pointerType:string };
  flowActive:boolean;
  invalidate: () => void;
  lastFrame: number;
  frameDelta: number;
  motion: MotionState;
  scrollSample?:{targetY:number;progress:number;centerTarget:number};
  wallProbe?:WallStageProbe;
  loading: {active:boolean;progress:number;compiled:boolean;frameReady:boolean;onCompiled?:()=>void;onFrame?:()=>void;onSampleError?:()=>void};
  drive?: (time: number, dt: number) => void;
  afterFrame?: (dt: number) => void;
  flushRestore?:()=>void;
}
export function createJourneyModel(): JourneyModel {
  return { progress: 0, pointer: { x: 0, y: 0, active: false, revision: 0, movedAt:-Infinity, buttons:0,pointerType:'mouse' },flowActive:false, invalidate: () => {}, lastFrame: 0, frameDelta:1/60, motion: createMotionState(),loading:{active:false,progress:1,compiled:false,frameReady:false} };
}

export function chapterPose(progress: number) {
  const index = Math.min(5, Math.floor(progress));
  const local = progress - index;
  const blend = local < .65 ? 0 : Math.min(1, (local - .65) / .35);
  return { index, next: Math.min(5, index + 1), blend: blend * blend * (3 - 2 * blend) };
}
