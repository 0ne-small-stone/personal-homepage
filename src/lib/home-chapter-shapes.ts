import { homeControlStrokes } from './home-control-shapes.ts';
import type { ChapterId } from '../components/home/home-chapters';

type Curve = number[];
type Stroke = { part: string; arrow: string; person: string };
const parts = ['head','left-arm','right-arm','forearm','left-leg','body','right-leg'];
const head = 'M10 7 C8.785 7 7.8 6.015 7.8 4.8 C7.8 3.585 8.785 2.6 10 2.6 C11.215 2.6 12.2 3.585 12.2 4.8 C12.2 6.015 11.215 7 10 7';
const standing = [head,
  'M10 9.5 C8.3 10.1 7 11.8 6 14',
  'M10 9.5 C11.5 9.9 13 10.1 14.3 10.3',
  'M14.3 10.3 C14.1 8.9 13.5 7.6 13.3 6.1',
  'M10 15.5 C8.9 17.3 7.8 19.2 6.8 21',
  'M10 7 C10 9.8 10 12.7 10 15.5',
  'M10 15.5 C11.1 17.3 12.2 19.2 13.2 21'];
const photo = [...standing];
photo[1] = 'M10 9.5 C8.9 11.1 7.7 11.8 7 10.8 C6.4 10 6.7 8.4 7.2 7.5';
photo[2] = 'M10 9.5 C11.5 10.4 13.2 11.4 14.4 10.8';
photo[3] = 'M14.4 10.8 C15.4 10.2 15.3 8.8 14.7 7.5';
// Closed cubic camera frame and lens move with both hands, rather than a waving forearm.
const camera = [
  {part:'camera',person:'M7.2 6 C9.7 6 12.2 6 14.7 6 C15 6 15.2 6.2 15.2 6.5 C15.2 7.4 15.2 8.3 15.2 9.2 C15.2 9.5 15 9.7 14.7 9.7 C12.2 9.7 9.7 9.7 7.2 9.7 C6.9 9.7 6.7 9.5 6.7 9.2 C6.7 8.3 6.7 7.4 6.7 6.5 C6.7 6.2 6.9 6 7.2 6'},
  {part:'lens',person:'M12.2 7.85 C12.2 9.45 9.8 9.45 9.8 7.85 C9.8 6.25 12.2 6.25 12.2 7.85'},
];
const making = [...standing];
making[1] = 'M10 9.5 C8.6 10.5 7.4 12.2 8.2 13.5 C8.7 14.2 10.1 14.6 11.5 14.6';
making[2] = 'M10 9.5 C11.5 10 13 10.5 14.5 11';
making[3] = 'M14.5 11 C15.7 11.5 16.4 11.5 17.5 11';
const work = [
  {part:'work',person:'M12 10.6 C13.667 10.6 15.333 10.6 17 10.6 C17.3 10.6 17.5 10.4 17.5 10.1 C17.5 9 17.5 7.9 17.5 6.8 C17.5 6.5 17.3 6.3 17 6.3 C15.333 6.3 13.667 6.3 12 6.3 C11.7 6.3 11.5 6.5 11.5 6.8 C11.5 7.9 11.5 9 11.5 10.1 C11.5 10.4 11.7 10.6 12 10.6'},
];

// Each numeral is a real path. Subdivision preserves its outline exactly while
// matching the person's cubic topology for the existing reversible controller.
function curves(path: string): Curve[] {
  const n = path.match(/-?\d*\.?\d+/g)!.map(Number), result: Curve[] = [];
  for (let i=2;i<n.length;i+=6) result.push([...n.slice(i-2,i), ...n.slice(i,i+6)]);
  return result;
}
function split(c: Curve): [Curve,Curve] {
  const mid=(a:number[],b:number[])=>a.map((v,i)=>(v+b[i])/2);
  const p=[c.slice(0,2),c.slice(2,4),c.slice(4,6),c.slice(6,8)];
  const a=mid(p[0],p[1]),b=mid(p[1],p[2]),d=mid(p[2],p[3]);
  const e=mid(a,b),f=mid(b,d),g=mid(e,f);
  return [[...p[0],...a,...e,...g],[...g,...f,...d,...p[3]]];
}
function subdivide(source: Curve[], count: number) {
  const out=source.slice();
  while(out.length<count) {
    const lengths=out.map(c=>Math.hypot(c[2]-c[0],c[3]-c[1])+Math.hypot(c[4]-c[2],c[5]-c[3])+Math.hypot(c[6]-c[4],c[7]-c[5]));
    const index=lengths.indexOf(Math.max(...lengths));
    out.splice(index,1,...split(out[index]));
  }
  return out;
}
function path(c: Curve[]) {
  const value=(v:number)=>String(Math.round(v*10000)/10000);
  return `M${c[0].slice(0,2).map(value).join(' ')} `+c.map(v=>'C'+v.slice(2).map(value).join(' ')).join(' ');
}
export const homeChapterNumerals = ['I', 'II', 'III', 'IV', 'V'] as const;

function line(x1: number, y1: number, x2: number, y2: number): Curve {
  const dx = (x2 - x1) / 3, dy = (y2 - y1) / 3;
  return [x1, y1, x1 + dx, y1 + dy, x2 - dx, y2 - dy, x2, y2];
}

const stem = (x: number) => line(x, 7, x, 17);
const vee = (x: number) => [line(x - 4, 7, x, 17), line(x, 17, x + 4, 7)];
const numerals = [
  [stem(12), line(9, 7, 15, 7), line(9, 17, 15, 17)],
  [stem(9.5), stem(14.5)],
  [stem(7), stem(12), stem(17)],
  [stem(6.5), ...vee(13.5)],
  vee(12),
];
export function homeChapterGesture(chapter: ChapterId) {
  return ({intro:'wave',album:'home-photo',radio:'home-music',projects:'home-make',wall:'home-warm-listen'})[chapter];
}
export function homeChapterStrokes(chapter: ChapterId, index: number): Stroke[] {
  if (!Number.isInteger(index) || index<0 || index>=numerals.length) throw new RangeError('Unknown homepage chapter index');
  const people = chapter==='radio' ? homeControlStrokes('sound',false).map(({part,person})=>({part,person}))
    : chapter==='wall' ? homeControlStrokes('wall',false).map(({part,person})=>({part,person}))
    : [...parts.map((part,i)=>({part,person:(chapter==='album'?photo:chapter==='projects'?making:standing)[i]})),...(chapter==='album'?camera:chapter==='projects'?work:[])];
  const strokes = subdivide(numerals[index], 7);
  const [x, y] = strokes[0];
  return people.map(({part,person},i)=>{
    const start = [strokes[i] ?? line(x, y, x, y)], end = curves(person);
    const count=Math.max(start.length,end.length);
    return {part,arrow:path(subdivide(start,count)),person:path(subdivide(end,count))};
  });
}
