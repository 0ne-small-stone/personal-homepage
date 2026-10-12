// Round30: bounded source/local protocol, actual time, old-build color regression.
const { chromium }=require(process.env.LSSH_QA_PLAYWRIGHT||'playwright');
const { PNG }=require(process.env.LSSH_QA_PNGJS||'pngjs');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),http=require('node:http');
const phase=process.env.LSSH_QA_PHASE||'initial',root=path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-09-30',phase);
fs.mkdirSync(root,{recursive:true});
const report={phase,date:new Date().toISOString(),method:'Native performance/RAF and actual trusted pointer input. Requested and received times kept separately. Shader solver remains one step per active RAF. Fixed clock/pose used only in color and layer controls; not timing evidence.',checks:[],sites:{},limitations:['Chrome SwiftShader and emulated touch; no real GPU/device performance conclusion. Source full pipeline has additional warp/scene/art; this slice compares black flow and input behavior, not whole-scene pixel identity.']};
const save=()=>fs.writeFileSync(path.join(root,'checks.json'),JSON.stringify(report,null,2));
const add=(name,pass,evidence)=>{report.checks.push({name,pass:!!pass,evidence});save();};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function init({fixed=false,noFloat=false,logical=false}={}){
  window.__frames=[];window.__inputs=[];window.__shots=[];window.__record=false;window.__needRead=false;
  window.__nativeNow=performance.now.bind(performance);window.__clock=0;window.__marks=[];
  if(fixed)Object.defineProperty(performance,'now',{configurable:true,value:()=>window.__clock});
  if(logical){const raf=requestAnimationFrame.bind(window),OriginalDate=Date;let time=0,last;Object.defineProperty(performance,'now',{value:()=>time});window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}};window.requestAnimationFrame=fn=>raf(t=>{if(t!==last){last=t;time+=1000/60;}fn(time);});}
  if(noFloat){const original=WebGL2RenderingContext.prototype.getExtension;WebGL2RenderingContext.prototype.getExtension=function(n){return n==='EXT_color_buffer_float'?null:original.call(this,n);};}
  try{sessionStorage.setItem('lssh.home.seen','true');sessionStorage.removeItem('lssh.home.paused');}catch{}
  document.addEventListener('DOMContentLoaded',()=>document.documentElement.dataset.motionDiagnostics='true',{once:true});
  window.__sample=sample=>{
    sample.received=window.__nativeNow();window.__flow=sample;if(window.__record)window.__frames.push(sample);
    if(sample.probe&&window.__marks.length){window.__shots.push({mark:window.__marks.shift(),state:sample,png:(window.__canvas||document.querySelector('.home-scene canvas')).toDataURL('image/png')});if(window.__marks.length){window.__needRead=true;window.dispatchEvent(new CustomEvent('lssh:flow-control',{detail:{read:true}}));}}
  };
  window.addEventListener('lssh:flow',e=>window.__sample(e.detail));
  document.addEventListener('lssh:motion',e=>window.__motion=e.detail);
  for(const type of ['pointermove','pointerleave','wheel','touchmove'])window.addEventListener(type,e=>{
    if(window.__record)window.__inputs.push({type,time:window.__nativeNow(),logicalTime:performance.now(),trusted:e.isTrusted,x:e.clientX,y:e.clientY,delta:e.deltaY,pointerType:e.pointerType});
    if(window.__armStop&&type==='pointermove'&&e.clientX===1020){window.__armStop=false;window.__stop=window.__nativeNow();for(const ms of [0,250,1000,2000])setTimeout(()=>{window.__marks.push({ms,requestedAt:window.__stop+ms});window.__needRead=true;window.dispatchEvent(new CustomEvent('lssh:flow-control',{detail:{read:true}}));},ms);}
  },{capture:true,passive:true});
}
const optics=/([\w$]+)\.uniforms\.uScene\.value=([\w$]+)\.texture;let ([\w$]+)=([\w$]+)\.environment\?\?([\w$]+)\.environment;\3 instanceof ([\w$]+)&&\(\1\.uniforms\.uEnvironment\.value=\3\),([\w$]+)\.getDrawingBufferSize\(\1\.uniforms\.uResolution\.value\)/g;
const sourceProbe=String.raw`{const f=gl._fluids,rt=f._fluidData.buffer,k=f._kernels.velocity.uniforms;let probe=null;if(globalThis.__needRead){const b=new Float32Array(rt.width*rt.height*4);renderer.readRenderTargetPixels(rt,0,0,rt.width,rt.height,b);let max=0,energy=0,invalid=0,nonzero=0;for(let j=0;j<b.length;j+=4){const v=Math.hypot(b[j],b[j+1]);if(!Number.isFinite(v))invalid++;else{max=Math.max(max,v);energy+=v*v;if(v>.001)nonzero++;}}probe={max,energy,invalid,nonzero,cells:rt.width*rt.height};globalThis.__needRead=false;}globalThis.__canvas=renderer.domElement;globalThis.__sample?.({time:performance.now(),y:scrollY,phase:scrollY<=100?'kv':'works_intro',size:[rt.width,rt.height],type:rt.texture.type,filter:rt.texture.minFilter,probe,input:{position:[lerper.get('pointerPosX')?.current??0,lerper.get('pointerPosY')?.current??0],residual:[lerper.get('pointerPosX')?.velocity??0,lerper.get('pointerPosY')?.velocity??0],velocity:[lerper.get('pointerVelocityX')?.current??0,lerper.get('pointerVelocityY')?.current??0],buffer:k.pointerVec.value.clone().multiplyScalar(2).toArray(),radius:.01+.1*Math.min(.5,MathUtils.smoothstep(k.pointerVec.value.length()*2,.01,1))}});}`;
async function pageFor(browser,name,spec={}){
  const {fixed=false,noFloat=false,old=false,logical=false,...contextSpec}=spec;const isSource=name.startsWith('source');
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,...contextSpec});
  const site={errors:[],failed:[],segments:[],images:[]};report.sites[name]=site;
  await page.addInitScript(init,{fixed,noFloat,logical});
  page.on('pageerror',e=>site.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')site.errors.push(e.text());});page.on('requestfailed',r=>site.failed.push({url:r.url(),error:r.failure()?.errorText}));
  if(isSource)await page.route('**/index.astro_astro_type_script_index_0_lang.*.js',async route=>{
    const response=await route.fetch(),body=await response.body();let code=body.toString();site.bundle={sha256:hash(body),bytes:body.length,url:response.url()};
    if(site.bundle.sha256!=='b2bd0d964416bd3db61b1392d2b645314e50ea79cadb09f69755d5f4c3791853')throw Error('Source changed');
    const anchor='lenis.raf(l);const i=gl.update();lerper.update(l)';if(code.split(anchor).length!==2)throw Error('Source anchor changed');
    await route.fulfill({response,body:code.replace(anchor,'lenis.raf(l);const i=gl.update();'+sourceProbe+'lerper.update(l)')});
  });
  else await page.route('**/HomeJourney.*.js',async route=>{
    const response=await route.fetch(),body=await response.body();let code=body.toString();site.bundle={sha256:hash(body),bytes:body.length,url:response.url()};
    if(fixed){const re=/([\w$]+\.current)\.quaternion\.copy\(([\w$]+)\.quaternion\)/g;if([...code.matchAll(re)].length!==1)throw Error('Pose anchor changed');code=code.replace(re,'$1.quaternion.set(0,0,0,1)');}
    if([...code.matchAll(optics)].length!==1)throw Error('Optics anchor changed');
    code=code.replace(optics,(all,material,target,environment,reflectionScene,scene,cube,renderer)=>`${all},globalThis.__optics={gl:${renderer},material:${material},target:${target},scene:${scene}}`);
    await route.fulfill({response,body:code});
  });
  await page.goto(isSource?'https://alche.studio/':old?report.baselineUrl:(process.env.LSSH_QA_URL||'http://127.0.0.1:4321/personal-homepage/'),{waitUntil:'domcontentloaded',timeout:60000});
  if(isSource){await page.locator('[data-sound-intro-decline]').click({timeout:15000}).catch(()=>{});await page.waitForFunction(()=>window.__flow?.size,{timeout:60000});await page.waitForTimeout(4000);}
  else await page.waitForFunction(()=>window.__optics&&document.body.dataset.homeStatus==='ready',null,{timeout:20000});
  if(!isSource)await page.evaluate(()=>{const gl=window.__optics.gl,render=gl.render.bind(gl);window.__draws=[];gl.render=(scene,camera)=>{if(scene===window.__optics.scene){window.__camera=camera;window.__draws.push({layers:camera.layers.mask,time:performance.now()});}return render(scene,camera);};});
  await page.evaluate(()=>document.fonts.ready);return{page,site};
}
const control=(page,data)=>page.evaluate(data=>window.dispatchEvent(new CustomEvent('lssh:flow-control',{detail:data})),data);
const read=page=>page.evaluate(()=>({...window.__flow,motion:window.__motion,cameraMatrices:window.__camera?{projection:window.__camera.projectionMatrix.toArray(),inverse:window.__camera.matrixWorldInverse.toArray()}:null,optics:window.__optics?{resolution:window.__optics.material.uniforms.uResolution.value.toArray(),objects:(()=>{const rows=[];window.__optics.scene.traverse(o=>{if(o.material?.map&&o.renderOrder===20)rows.push({name:'intro',alpha:o.material.opacity,uv:o.material.map.offset.toArray(),matrix:o.matrixWorld.toArray()});});return rows;})()}:null}));
async function tick(page,n=96){for(let i=0;i<n;i++)await page.evaluate(()=>new Promise(resolve=>{window.__clock+=50;requestAnimationFrame(()=>requestAnimationFrame(resolve));}));}
async function position(page,y,fixed=false){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);if(fixed)await tick(page);else await page.waitForTimeout(1300);}
async function shot(page,site,name){const file=`${name}.png`;await page.screenshot({path:path.join(root,file)});site.images.push({file,state:await read(page)});save();return file;}
async function pointerSeries(page,site,name,y,ms){
  await position(page,y);await page.mouse.move(720,450);await page.waitForTimeout(450);
  if(name!=='source')await control(page,{reset:true});
  await page.evaluate(()=>{window.__frames=[];window.__inputs=[];window.__shots=[];window.__marks=[];window.__record=true;window.__armStop=true;});
  const start=performance.now(),requested=[],pending=[],cdp=await page.context().newCDPSession(page);
  // Pipeline trusted CDP events; waiting for each GPU-bound acknowledgment erased the speed difference.
  for(let i=1;i<=10;i++){const at=start+i*ms/10;await new Promise(resolve=>setTimeout(resolve,Math.max(0,at-performance.now())));requested.push({at:performance.now()-start,x:720+i*30,y:450});pending.push(cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:720+i*30,y:450}));}
  await Promise.all(pending);await cdp.detach();await page.waitForFunction(()=>window.__shots.length>=4,null,{timeout:12000});
  const segment=await page.evaluate(()=>{window.__record=false;return{frames:window.__frames,inputs:window.__inputs,shots:window.__shots,stop:window.__stop};});
  segment.name=`${y?'intro':'kv'}-${ms===100?'fast':'slow'}`;segment.requested=requested;
  for(const shot of segment.shots){shot.file=`${name}-${segment.name}-${shot.mark.ms}.png`;fs.writeFileSync(path.join(root,shot.file),Buffer.from(shot.png.split(',')[1],'base64'));delete shot.png;site.images.push({file:shot.file,state:shot.state,mark:shot.mark});}
  site.segments.push(segment);save();return segment;
}
function pixelDiff(a,b,rect){a=PNG.sync.read(fs.readFileSync(path.join(root,a)));b=PNG.sync.read(fs.readFileSync(path.join(root,b)));let count=0,max=0,sum=0;
  if(a.width!==b.width||a.height!==b.height)return{differentSize:true};const [x,y,w,h]=rect||[0,0,a.width,a.height];
  for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){const p=(j*a.width+i)*4;let d=0;for(let c=0;c<3;c++){const v=Math.abs(a.data[p+c]-b.data[p+c]);max=Math.max(max,v);sum+=v;d=Math.max(d,v);}if(d)count++;}return{pixels:w*h,changed:count,max,mean:sum/(w*h*3)};
}
async function colors(browser){
  const old=await pageFor(browser,'old-color',{fixed:true,old:true}),fresh=await pageFor(browser,'new-color',{fixed:true});
  for(const y of [0,550,1350]){
    await control(fresh.page,{freeze:true,forceZero:true,reset:true});
    for(const {page} of [old,fresh]){await page.mouse.move(720,450);await position(page,y,true);await page.evaluate(()=>{document.querySelectorAll('svg').forEach(el=>el.getAnimations().forEach(a=>{a.pause();a.currentTime=0;}));});}
    for(const {page} of [old,fresh])await tick(page,2);
    const a=await shot(old.page,old.site,`old-zero-${y}`),b=await shot(fresh.page,fresh.site,`new-zero-${y}`);
    const oldState=await read(old.page),newState=await read(fresh.page);add(`same camera/intro UV and settled motion S=${y}`,JSON.stringify(oldState.cameraMatrices)===JSON.stringify(newState.cameraMatrices)&&JSON.stringify(oldState.optics.objects)===JSON.stringify(newState.optics.objects)&&JSON.stringify(oldState.motion.rendered)===JSON.stringify(newState.motion.rendered),{old:oldState,new:newState});
    const d=pixelDiff(a,b);add(`zero field matches round29 at S=${y}`,d.max<=1,d);
    if(y===0){const s=await read(fresh.page);add('full screen copy/composite runs at zero flow',s.running&&!s.control.bypass&&s.capture==='copyFramebufferToTexture'&&s.colorSize[0]===1440&&s.colorSize[1]===900,s);}
  }
  await control(fresh.page,{freeze:false,forceZero:false,reset:true,foregroundOnly:true});await fresh.page.mouse.move(970,380);await tick(fresh.page,12);await control(fresh.page,{freeze:true});await tick(fresh.page,120);
  const on=await shot(fresh.page,fresh.site,'foreground-on');await control(fresh.page,{forceZero:true});await tick(fresh.page,2);const off=await shot(fresh.page,fresh.site,'foreground-zero');
  add('isolated partial layer1 is independent of flow',pixelDiff(on,off).max===0&&((await read(fresh.page)).cards[0].alpha>0&&(await read(fresh.page)).cards[0].alpha<1),{diff:pixelDiff(on,off),cards:(await read(fresh.page)).cards});
  await control(fresh.page,{foregroundOnly:false,forceZero:false});await position(fresh.page,1900,true);await fresh.page.locator('#entry-projects').click();await fresh.page.waitForURL('**/showcase/');add('foreground CTA enters real column',true,{url:fresh.page.url()});
  await old.page.close();await fresh.page.close();
}
async function lifecycle(browser){
  const {page,site}=await pageFor(browser,'lifecycle',{deviceScaleFactor:1.5});await page.mouse.move(720,450);await page.waitForTimeout(300);await page.mouse.move(1000,450);await page.waitForTimeout(200);
  const initial=await read(page);await page.getByRole('button',{name:'暂停动态',exact:true}).click();await page.waitForTimeout(150);await page.mouse.move(500,350);await page.getByRole('button',{name:'继续动态',exact:true}).click();await page.waitForTimeout(200);await control(page,{read:true});await page.waitForTimeout(100);const resumed=await read(page);
  add('pause/resume discards old injection',resumed.running&&resumed.input.buffer.every(v=>Math.abs(v)<1e-8),{initial,resumed});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.mouse.move(700,500);await page.waitForTimeout(150);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);
  const visible=await read(page);add('simulated visibility wake clears source',visible.input.buffer.every(v=>Math.abs(v)<1e-8),visible);
  await page.setViewportSize({width:1000,height:700});await page.waitForTimeout(350);const resized=await read(page);
  const ratios=await page.evaluate(()=>({resolution:window.__optics.material.uniforms.uResolution.value.toArray(),canvas:[window.__optics.gl.domElement.width,window.__optics.gl.domElement.height],state:{target:window.__optics.gl.getRenderTarget(),layers:window.__optics.scene.children.length,autoClear:window.__optics.gl.autoClear,error:window.__optics.gl.getContext().getError()}}));
  add('DPR1.5 resize preserves sampling and GL state',resized.colorSize[0]===1500&&resized.colorSize[1]===1050&&JSON.stringify(ratios.resolution)===JSON.stringify(ratios.canvas)&&ratios.state.target===null&&ratios.state.autoClear&&ratios.state.error===0,{resized,ratios});
  await position(page,6200);const wall=await read(page);add('wall flow is neutral',!wall.running&&wall.input.source.every(v=>v===0),wall);
  const memories=[];
  for(let i=0;i<3;i++){await position(page,2200);await page.locator('#entry-radio').click();await page.waitForURL('**/music/');await page.goBack({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__flow?.running&&!document.body.dataset.homeRestoring);await page.waitForTimeout(1600);const s=await read(page);memories.push(s);}
  add('real column back initializes one canvas without growth after ready window',memories.every(s=>s.canvases===1&&s.initialization.reason==='back-forward'&&s.input.buffer.every(v=>v===0))&&memories[2].textures<=memories[1].textures&&memories[1].textures<=memories[0].textures,{memories});
  await shot(page,site,'return');await page.close();
}
async function fallback(browser,name,spec,expected){
  const {page,site}=await pageFor(browser,name,spec);await page.mouse.move(250,400);await page.waitForTimeout(200);const s=await read(page);
  add(`${name}: expected fluid capability`,expected?s.running:!s.running,{state:s,links:await page.locator('.home-cta').count()});
  if(name==='touch'){await page.evaluate(()=>{window.__record=true;});const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:195,y:680}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:680-i*65}]});await page.waitForTimeout(30);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);add('touch keeps native scroll',await page.evaluate(()=>scrollY>100&&window.__inputs.some(e=>e.type==='touchmove'&&e.trusted)),await read(page));await cdp.detach();}
  if(name==='low'){await page.getByRole('button',{name:'光影细节',exact:true}).click();await page.waitForTimeout(150);add('low quality turns off optional flow',!(await read(page)).running,await read(page));}
  await shot(page,site,name);await page.close();
}
async function controlledComparison(browser,name){
  const {page,site}=await pageFor(browser,name+'-controlled',{logical:true});
  site.method='One logical 1000/60ms tick per native RAF timestamp; native receive/wall time retained. Frame protocol separates solver/input behavior from software GPU throughput.';
  const results=[];
  for(const points of [6,60]){
    await page.mouse.move(720,450);const aligned=await page.evaluate(()=>performance.now());await page.waitForFunction(t=>performance.now()>=t+800,aligned);
    if(name==='local')await control(page,{reset:true});
    await page.evaluate(()=>{window.__frames=[];window.__inputs=[];window.__record=true;});
    for(let i=1;i<=points;i++){await page.mouse.move(720+i*300/points,450);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));}
    const stopped=await page.evaluate(()=>({logical:performance.now(),wall:window.__nativeNow()}));await page.waitForFunction(t=>performance.now()>=t+2000,stopped.logical);
    const data=await page.evaluate(()=>{window.__record=false;return{frames:window.__frames,inputs:window.__inputs};});data.name=points===6?'6-frame-fast':'60-frame-slow';data.stopped=stopped;site.segments.push(data);results.push(data);
  }
  const peak=s=>Math.max(...s.frames.map(f=>Math.hypot(...f.input.buffer))),radius=s=>Math.max(...s.frames.map(f=>f.input.radius)),duration=s=>s.inputs.at(-1).logicalTime-s.inputs[0].logicalTime;
  add(`${name}: controlled 60Hz input distinguishes fast/slow`,duration(results[0])<duration(results[1])*.35&&peak(results[0])>peak(results[1])&&radius(results[0])>radius(results[1]),results.map(s=>({name:s.name,logicalDuration:duration(s),physicalDuration:s.inputs.at(-1).time-s.inputs[0].time,peak:peak(s),radius:radius(s),frames:s.frames.length})));
  await page.close();save();
}
async function resourceClosure(browser){
  const {page,site}=await pageFor(browser,'resource-closure',{viewport:{width:1000,height:700},deviceScaleFactor:1.5});
  async function stable(label){
    const samples=[];let same=[];const start=Date.now();
    while(Date.now()-start<12000){
      const sample=await page.evaluate(()=>{const gl=window.__optics.gl,images=[];window.__optics.scene.traverse(o=>{if(o.layers.mask===2&&o.material?.map){const t=o.material.map;images.push({width:t.image?.width,height:t.image?.height,uploaded:!!gl.properties.get(t).__webglTexture});}});return{received:window.__nativeNow(),frame:window.__flow?.frame,textures:gl.info.memory.textures,programs:gl.info.programs?.length,programNames:gl.info.programs?.map(p=>({name:p.name,usedTimes:p.usedTimes})),images};});
      if(sample.frame!==samples.at(-1)?.frame){samples.push(sample);const last=same.at(-1);if(last&&(last.textures!==sample.textures||last.programs!==sample.programs))same=[];same.push(sample);}
      if(same.length>=6&&same.at(-1).received-same[0].received>=900&&sample.images.length===4&&sample.images.every(i=>i.width>0&&i.height>0))return{label,samples,stable:same,state:await read(page)};
      await page.waitForTimeout(150);
    }
    throw Error('No stable six-frame resource window: '+JSON.stringify(samples));
  }
  await position(page,2200);const windows=[await stable('warm baseline')];
  for(let i=0;i<3;i++){await page.locator('#entry-radio').click();await page.waitForURL('**/music/');await page.goBack({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__flow?.running&&!document.body.dataset.homeRestoring);windows.push(await stable('return '+(i+1)));}
  add('stable six-frame resource windows: warmed baseline and three real returns',windows.every(w=>w.state.canvases===1&&w.state.input.buffer.every(v=>v===0))&&windows.slice(1).every(w=>w.state.initialization.reason==='back-forward')&&windows.every(w=>w.state.textures===windows[0].state.textures&&w.state.programs===windows[0].state.programs),{windows});
  add('resource closure: no local script/render errors',site.errors.length===0,{errors:site.errors,failed:site.failed});
  await page.close();
}
(async()=>{
  const baseline=path.resolve('.ci-tmp/p01-30-baseline/dist');
  const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');let p=decodeURIComponent(u.pathname).replace(/^\/personal-homepage\/?/,'');if(p.endsWith('/')||!path.extname(p))p+='index.html';const file=path.resolve(baseline,p);if(!file.startsWith(baseline+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));report.baselineUrl=`http://127.0.0.1:${server.address().port}/personal-homepage/`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.LSSH_QA_BROWSER,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});report.browser=browser.version();
  try{
    if(process.env.LSSH_QA_CLOSURE){await resourceClosure(browser);}
    else {
    if(!process.env.LSSH_QA_TARGETED)for(const name of ['source','local']){
      const {page,site}=await pageFor(browser,name);console.log(name+': ready');
      for(const y of [0,550]){const fast=await pointerSeries(page,site,name,y,100),slow=await pointerSeries(page,site,name,y,1000);const peak=a=>Math.max(...a.frames.map(f=>Math.hypot(...f.input.buffer))),radius=a=>Math.max(...a.frames.map(f=>f.input.radius));
        const duration=a=>a.inputs.at(-1).time-a.inputs[0].time;
        add(`${name} ${y}: fast input stronger and wider with distinct received duration`,duration(fast)<duration(slow)*.5&&peak(fast)>peak(slow)&&radius(fast)>radius(slow),{fast:{duration:duration(fast),peak:peak(fast),radius:radius(fast),requested:fast.requested,received:fast.inputs},slow:{duration:duration(slow),peak:peak(slow),radius:radius(slow),requested:slow.requested,received:slow.inputs}});
        for(const s of [fast,slow]){const energies=s.shots.map(x=>x.state.probe.energy);add(`${name} ${s.name}: actual stop source weakens and field decays after peak`,s.shots.length===4&&s.shots.every(x=>x.state.probe.invalid===0)&&energies.at(-1)<Math.max(...energies)*.99,{samples:s.shots.map(x=>({ms:x.mark.ms,actualMs:x.state.received-s.stop,probe:x.state.probe,input:x.state.input,file:x.file})),frameCount:s.frames.length});}
      }
      if(name==='local'){const state=await read(page);add('single canvas explicit nine passes float/linear',state.canvases===1&&state.input.passes===9&&state.type===1015&&state.filter===1006&&JSON.stringify(state.size)==='[256,160]',state);}
      await page.close();console.log(name+': traces saved');
    }
    await colors(browser);await lifecycle(browser);
    for(const [name,spec,expected]of [['narrow',{viewport:{width:600,height:844}},true],['low',{},true],['touch',{viewport:{width:390,height:844},isMobile:true,hasTouch:true},false],['no-float',{noFloat:true},false],['reduced',{reducedMotion:'reduce'},false]]){try{await fallback(browser,name,spec,expected);}catch(e){add(`${name}: ability case completed`,false,{error:e.stack});}}
    await controlledComparison(browser,'source');await controlledComparison(browser,'local');
    for(const [name,site]of Object.entries(report.sites))add(`${name}: script/render errors`,site.errors.every(e=>name.startsWith('source')&&(e==='Network request failed'||/net::ERR|Failed to load resource|<svg> attribute height/.test(e))),{errors:site.errors,failed:site.failed,classification:name.startsWith('source')?'Original SVG auto-height and external-network failures retained, not silently removed.':'Local errors must be absent.'});
    }
  }catch(e){report.fatal=e.stack;console.error(e.stack);}finally{await browser.close();server.close();report.pass=!report.fatal&&report.checks.every(c=>c.pass);save();console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>({name:c.name,pass:c.pass})),fatal:report.fatal}));if(!report.pass)process.exitCode=1;}
})();
