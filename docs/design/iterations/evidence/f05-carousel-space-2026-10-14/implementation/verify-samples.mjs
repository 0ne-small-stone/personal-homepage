import fs from 'node:fs';
const samples=JSON.parse(fs.readFileSync(new URL('./browser-samples.json',import.meta.url),'utf8'));
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const inside=(poly,p)=>{
  const values=poly.map((a,i)=>cross(a,poly[(i+1)%4],p));
  return values.every(v=>v>=-1e-7)||values.every(v=>v<=1e-7);
};
const visible=samples.filter(s=>s.background?.visible&&s.background.weight>0);
const failures=visible.filter(s=>!s.background.corners?.every(p=>p.every(Number.isFinite))||
  ![[-1,-1],[1,-1],[1,1],[-1,1]].every(p=>inside(s.background.corners,p))).map(s=>s.label);
const linear=v=>{const x=v/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;};
const report={samples:samples.length,visibleBackgroundSamples:visible.length,viewportCornerFailures:failures,
  contrastLowerBound:{mutedA1AgainstMax24:(linear(161)+.05)/(linear(36)+.05),textEDAgainstMax24:(linear(237)+.05)/(linear(36)+.05)},
  note:'Numeric projected-quad and opaque-token bounds; not a same-frame pixel or actual-device performance audit.'};
fs.writeFileSync(new URL('./sample-checks.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(failures.length)process.exitCode=1;
