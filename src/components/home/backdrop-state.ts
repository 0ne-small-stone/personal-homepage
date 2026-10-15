import { workCount } from './motion-ranges.ts';
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number, a: number, b: number) => { const t=clamp((x-a)/(b-a)); return t*t*(3-2*t); };

// A reversible function of the shared scroll state, with no clock or chapter switch.
export function backdropState(index: number, intro: number, outro: number, prepare: number, progress: number, mobile: boolean, quiet: boolean) {
  const q=quiet?0:clamp((index-1)/Math.max(1,workCount-1));
  const weight=quiet?0:smooth(intro,.45,1)*(1-.55*smooth(outro,0,1))*(1-smooth(prepare,0,.25));
  return {q,weight,intro:quiet?1:(1-smooth(progress,.6,1))*(1-weight),
    farOffset:[(q-.5)*.035,(q-.5)*.015],gridOffset:[(q-.5)*.07,(q-.5)*.025],
    light:[(mobile?.62:.72)-(mobile?.24:.44)*q,.30+.24*(q-.5)**2],
    spacing:mobile?96:104,farBrightness:.52,fieldPeak:.048,gridPeak:.048,ceiling:36/255};
}
