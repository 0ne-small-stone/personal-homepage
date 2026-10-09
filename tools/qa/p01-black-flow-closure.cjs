// Narrow attribution from retained captures/windows; does not rerun or rewrite failures.
const fs=require('node:fs'),path=require('node:path');
const {PNG}=require(process.env.LSSH_QA_PNGJS||'pngjs');
const root=path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-09-30');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const targeted=load('targeted/checks.json'),resources=load('resource-closure/checks.json');
const a=PNG.sync.read(fs.readFileSync(path.join(root,'targeted/old-zero-0.png'))),b=PNG.sync.read(fs.readFileSync(path.join(root,'targeted/new-zero-0.png')));
const bounds=[52,643,63,659];let changed=0,outside=0,max=0;
for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++){let d=0;for(let c=0;c<3;c++)d=Math.max(d,Math.abs(a.data[(y*a.width+x)*4+c]-b.data[(y*b.width+x)*4+c]));if(d){changed++;max=Math.max(max,d);if(x<bounds[0]||x>bounds[2]||y<bounds[1]||y>bounds[3])outside++;}}
const windows=resources.checks[0].evidence.windows;
const rows=windows.map(w=>({label:w.label,frames:w.stable.map(s=>s.frame),span:w.stable.at(-1).received-w.stable[0].received,textures:w.state.textures,programs:w.state.programs,gpuPrograms:w.stable.at(-1).programNames.filter(p=>p.name==='GPUComputationShader').length,canvases:w.state.canvases,buffer:w.state.input.buffer,reason:w.state.initialization.reason,images:w.stable.at(-1).images}));
const checks=[
  {name:'S0 differences confined to independently animated DOM arrow; all remaining pixels identical',pass:changed===46&&max===7&&outside===0,evidence:{bounds,changed,max,outside,css:'src/styles/home.css:38–39: .home-scroll svg animation scroll-hint 2.8s ease-in-out infinite',attribution:'Actual old/new crops inspected. Design reviewer independently confirmed all 46 pixels are the downward SVG. Preserve original full-page pixel gate fail; no application change or excluded GPU geometry.'}},
  {name:'resource budgets remain bounded across stable windows and last two returns agree',pass:rows.every(r=>r.frames.length>=6&&r.span>=900&&r.canvases===1&&r.gpuPrograms===7&&r.buffer.every(v=>v===0)&&r.textures<=rows[0].textures&&r.programs<=rows[0].programs)&&rows.slice(1).every(r=>r.reason==='back-forward')&&rows.at(-1).textures===rows.at(-2).textures&&rows.at(-1).programs===rows.at(-2).programs,evidence:{rows,attribution:'Four decoded card maps are uploaded in every window. Seven GPUComputationShader programs are present throughout. First return has six other scene programs; later returns eight, at or below warmed baseline. This is consistent with lazy compilation of other rendered scene branches; their exact owners were not enumerated. No continuous texture/program growth is observed in these three returns; this is bounded evidence, not a long-run memory guarantee.'}},
];
const report={date:new Date().toISOString(),method:'Read-only attribution using retained targeted pixels and four continuous six-frame resource windows. Original failed reports remain unchanged.',checks,pass:checks.every(c=>c.pass),remainingTargetedFailures:targeted.checks.filter(c=>!c.pass).map(c=>c.name)};
fs.writeFileSync(path.join(root,'closure-analysis.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
