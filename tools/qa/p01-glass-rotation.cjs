// P01/T03.01: actual input traces, controlled 60Hz clock, source/local comparison.
const { chromium } = require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const out = path.resolve('docs/design/iterations/evidence/u03-p01-2026-10-09-29');
const phase = process.env.LSSH_QA_PHASE || 'initial';
const root = path.join(out, phase); fs.mkdirSync(root, { recursive: true });
const sourceHash = 'b2bd0d964416bd3db61b1392d2b645314e50ea79cadb09f69755d5f4c3791853';
const report = { date: new Date().toISOString(), phase, method: 'Actual browser input. One synthetic clock tick per native browser RAF timestamp, 1000/60ms; Date and performance/RAF share the clock. Wall time kept separately. No pose/material/input state override.', sites: {}, checks: [], limitations: ['SwiftShader, simulated touch/layout; not real device or hardware performance.', 'Source Date GL delta rounds to 16/17ms; local delta is 16.6667ms. Lifecycle and same-target phase continuity are site adaptations. Initial Euler order was wrong in SYSTEM and implementation; confirmation must match corrected original order.'] };
const save = () => fs.writeFileSync(path.join(root, 'checks.json'), JSON.stringify(report, null, 2));
const add = (name, pass, evidence) => report.checks.push({ name, pass: !!pass, evidence });
const angle = q => 2 * Math.acos(Math.min(1, Math.abs(q[3])));
const distance = (a,b) => 2 * Math.acos(Math.min(1, Math.abs(a.reduce((s,v,i)=>s+v*b[i],0))));
function init() {
  const originalNow = performance.now.bind(performance), nativeRaf = requestAnimationFrame.bind(window), OriginalDate = Date;
  const epoch = OriginalDate.now() - originalNow(); let virtual = originalNow(), timestamp;
  window.__wallNow = originalNow;
  performance.now = () => virtual;
  window.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [epoch + virtual])); } static now() { return epoch + virtual; } };
  window.requestAnimationFrame = callback => nativeRaf(time => { if (timestamp !== time) { timestamp = time; virtual += 1000/60; } callback(virtual); });
  window.__trace = []; window.__inputs = []; window.__record = false;
  window.__sample = sample => { sample.wallTime = originalNow(); window.__latest = sample; if (window.__record) window.__trace.push(sample); };
  document.addEventListener('lssh:glass-rotation', event => window.__sample(event.detail));
  for (const type of ['pointermove','pointerleave','wheel','touchstart','touchmove','touchend']) window.addEventListener(type, e => {
    if (window.__record) window.__inputs.push({ type, time: virtual, wallTime: originalNow(), trusted: e.isTrusted, x:e.clientX,y:e.clientY,delta:e.deltaY,pointerType:e.pointerType });
  }, { capture:true, passive:true });
  document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.motionDiagnostics='true'; try {sessionStorage.setItem('lssh.home.seen','true');}catch{} }, {once:true});
}
const sourceBefore = String.raw`const __qaBefore={w:gl.sceneMain._mainLogo._animator.get('worksRotate')??0,euler:[gl.sceneMain._mainLogo._tmpEuler.x,gl.sceneMain._mainLogo._tmpEuler.y,gl.sceneMain._mainLogo._tmpEuler.z]};`;
const sourceProbe = String.raw`{const m=gl.sceneMain._mainLogo,p=m?._logoMesh,x=lerper.get('mainLogo_hover_x'),y=lerper.get('mainLogo_hover_y'),v=lerper.get('mainLogo_lenisVelocity');if(p)globalThis.__sample?.({time:performance.now(),y:scrollY,rotation:{dt:i,phase:scrollY<=100?'kv':scrollY<innerHeight+100?'works_intro':'works',pointer:{target:[x?.target??0,y?.target??0],current:[x?.current??0,y?.current??0],residual:[x?.velocity??0,y?.velocity??0],weight:.01*Math.max(0,1-1.5*Math.hypot(x?.target??0,y?.target??0))*m._currentSectionConfig.hoverRotationMultiplier},worksRotate:{value:m._animator.get('worksRotate')??0,target:m._currentSectionConfig.animationIntensity},wBefore:__qaBefore.w,eulerBefore:__qaBefore.euler,euler:[m._tmpEuler.x,m._tmpEuler.y,m._tmpEuler.z],velocity:{raw:lenis.velocity,clamped:Math.max(-30,Math.min(30,lenis.velocity)),current:v?.current??0},quaternion:p.quaternion.toArray()},camera:{position:gl.sceneMain.camera.position.toArray(),fov:gl.sceneMain.camera.fov}});}`;
async function pageFor(browser, kind, spec={}) {
  const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,...spec});
  const site = { errors:[],failed:[],segments:[],images:[] }; report.sites[kind]=site;
  await page.addInitScript(init);
  page.on('pageerror',e=>site.errors.push(e.message)); page.on('requestfailed',r=>site.failed.push({url:r.url(),error:r.failure()?.errorText}));
  if(kind==='source') await page.route('**/index.astro_astro_type_script_index_0_lang.*.js',async route=>{
    const res=await route.fetch(), body=await res.body(), code=body.toString('utf8');
    site.bundle={url:res.url(),sha256:crypto.createHash('sha256').update(body).digest('hex'),bytes:body.length};
    if(site.bundle.sha256!==sourceHash)throw Error('Source bundle changed');
    const anchor='lenis.raf(l);const i=gl.update();lerper.update(l)';
    if(code.split(anchor).length!==2)throw Error('Source probe anchor must be unique');
    await route.fulfill({response:res,body:code.replace(anchor,'lenis.raf(l);'+sourceBefore+'const i=gl.update();'+sourceProbe+'lerper.update(l)')});
  });
  else page.on('response',async res=>{if(/\/HomeJourney\.[^/]+\.js$/.test(res.url())){try{const body=await res.body();site.bundle={url:res.url(),sha256:crypto.createHash('sha256').update(body).digest('hex'),bytes:body.length};}catch{}}});
  await page.goto(kind==='source'?'https://alche.studio/':process.env.LSSH_QA_URL||'http://127.0.0.1:4321/personal-homepage/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__latest?.rotation?.quaternion,null,{timeout:60000});
  if(kind==='source'){await page.locator('[data-sound-intro-decline]').click({timeout:5000}).catch(()=>{});await page.waitForFunction(()=>document.querySelector('.Loading__container')?.getAttribute('data-hidden')!==null,null,{timeout:15000}).catch(()=>{});}
  else await page.waitForFunction(()=>document.body.dataset.homeStatus==='ready');
  return {page,site};
}
const read = page=>page.evaluate(()=>window.__latest);
async function wait(page, ms) { const time=await page.evaluate(()=>performance.now()); await page.waitForFunction(t=>performance.now()>=t,time+ms,{timeout:60000}); }
async function start(page) { await page.evaluate(()=>{window.__trace=[];window.__inputs=[];window.__record=true;}); return (await read(page)).time; }
async function stop(page, site, name, requested=[]) { const result=await page.evaluate(()=>{window.__record=false;return {frames:window.__trace,inputs:window.__inputs};});const entry={name,requested,...result};site.segments.push(entry);save();return entry; }
async function shot(page,site,kind,name){const file=`${kind}-${name}.png`;await page.screenshot({path:path.join(root,file)});site.images.push({file,name,state:await read(page)});save();}
async function move(page,x,y){await page.mouse.move(x,y);}
async function scroll(page,y){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);}
function sampleAt(frames,time){return frames.reduce((a,b)=>Math.abs(b.time-time)<Math.abs(a.time-time)?b:a);}
async function mainSeries(page,site,kind) {
  await scroll(page,0);await wait(page,500);
  await start(page);await wait(page,5000);const still=await stop(page,site,'top-still-5s');
  add(`${kind}: top has no idle rotation`,still.frames.every(f=>angle(f.rotation.quaternion)<1e-5),{frames:still.frames.length,maxAngle:Math.max(...still.frames.map(f=>angle(f.rotation.quaternion)))});
  await shot(page,site,kind,'still');
  let time=await start(page), actions=[];
  for(const [at,x,y]of [[0,792,450],[400,720,450],[600,864,450],[800,576,450],[1000,720,450],[1200,720,360],[1400,720,540],[1600,720,450],[6200,1350,450],[6600,-2,-2],[7100,720,450]]){
    await page.waitForFunction(t=>performance.now()>=t,time+at);actions.push({at,x,y,time:(await read(page)).time});await move(page,x,y);
  }
  await wait(page,700);const pointer=await stop(page,site,'pointer-region-stop-leave',actions);
  await shot(page,site,kind,'pointer-return');
  const first=pointer.frames.find(f=>f.rotation.pointer.target[0]>.09);
  add(`${kind}: first pointer has no residual pulse`,first&&first.rotation.pointer.residual.every(v=>Math.abs(v)<1e-9),first?.rotation);
  const outside=pointer.frames.filter(f=>Math.hypot(...f.rotation.pointer.target)>.67);
  add(`${kind}: outside ellipse has zero drive`,outside.length>2&&outside.every(f=>f.rotation.pointer.weight===0),{frames:outside.length});
  const stopped=pointer.frames.filter(f=>f.time>=time+1700&&f.time<time+6100),peak=Math.max(...pointer.frames.map(f=>angle(f.rotation.quaternion)));
  add(`${kind}: stopped input decays and returns`,stopped.length>2&&Math.hypot(...stopped.at(-1).rotation.pointer.residual)<1e-5&&angle(stopped.at(-1).rotation.quaternion)<peak*.6,{peak,lastAngle:angle(stopped.at(-1).rotation.quaternion),residual:stopped.at(-1).rotation.pointer.residual});
  if(kind!=='source'){const leave=pointer.frames.filter(f=>f.time>=time+6650&&f.time<time+7000);add('local: leave retains latest NDC without reverse drive',leave.length>1&&leave.every(f=>!f.rotation.pointer.active&&f.rotation.pointer.weight===0&&f.rotation.pointer.target.some(v=>v!==0)),{frames:leave.length});}
  await scroll(page,95);await wait(page,1300);time=await start(page);await scroll(page,105);await wait(page,250);await move(page,720,360);await wait(page,500);await move(page,720,450);await wait(page,350);
  await scroll(page,1005);await wait(page,300);const stages=await stop(page,site,'G-and-H-plus-G');
  const entry=stages.frames.find(f=>f.rotation.phase==='works_intro');
  const milestones=[0,250,500,750,1000].map(ms=>({requestedMs:ms,...sampleAt(stages.frames,entry.time+ms)}));site.stageSamples=milestones;
  add(`${kind}: worksRotate follows sharp sigmoid`,[250,500,750].every(ms=>{const f=sampleAt(stages.frames,entry.time+ms),w=f.rotation.worksRotate.value;return ms===250?w<.12:ms===500?w>.4&&w<.65:w>.9;}),milestones.map(f=>({requestedMs:f.requestedMs,time:f.time,value:f.rotation.worksRotate.value})));
  const discriminatory=stages.frames.filter(f=>{const r=f.rotation;return Math.abs(r.pointer.residual[1])>.01&&r.pointer.weight>0&&r.worksRotate.value>.05&&r.worksRotate.value<.99;});
  const errors=discriminatory.map(f=>{const r=f.rotation;return Math.abs(r.euler[0]-(r.eulerBefore[0]-r.pointer.residual[1]*r.pointer.weight*(1-.7*r.wBefore))*(1-r.dt));});
  const wrong=discriminatory.map(f=>{const r=f.rotation;return Math.abs(r.euler[0]-(r.eulerBefore[0]*(1-r.dt)-r.pointer.residual[1]*r.pointer.weight*(1-.7*r.worksRotate.value)));});
  add(`${kind}: source order distinguished during vertical transition`,discriminatory.length>5&&Math.max(...errors)<1e-10&&Math.max(...wrong)>1e-7,{frames:discriminatory.length,maxCorrectError:Math.max(...errors),maxWrongOrderError:Math.max(...wrong)});
  if(kind!=='source'){const a=stages.frames.filter(f=>f.rotation.phase==='works_intro').at(-1),b=stages.frames.find(f=>f.rotation.phase==='works');add('local: intro to works does not restart',a&&b&&a.rotation.worksRotate.revision===b.rotation.worksRotate.revision&&b.rotation.worksRotate.value===1,{before:a?.rotation.worksRotate,after:b?.rotation.worksRotate});}
  await scroll(page,95);await wait(page,1200);time=await start(page);await scroll(page,105);await wait(page,300);await scroll(page,95);await wait(page,1000);const reverse=await stop(page,site,'quick-stage-reversal');
  const targetReturn=reverse.frames.find(f=>f.time>time+250&&f.rotation.phase==='kv');
  add(`${kind}: reverse starts at partial value`,targetReturn&&targetReturn.rotation.worksRotate.value>0&&targetReturn.rotation.worksRotate.value<.3&&reverse.frames.at(-1).rotation.worksRotate.value<.002,targetReturn?.rotation.worksRotate);
  await scroll(page,1900);await move(page,720,450);await wait(page,1300);time=await start(page);const cdp=await page.context().newCDPSession(page),wheel=[];
  for(const [at,delta]of [[0,360],[200,360],[1600,-360],[1800,-360]]){await page.waitForFunction(t=>performance.now()>=t,time+at);wheel.push({at,delta,time:(await read(page)).time});await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:720,y:450,deltaX:0,deltaY:delta});}
  await wait(page,1700);await cdp.detach();const speed=await stop(page,site,'wheel-forward-stop-reverse',wheel);
  const velocities=speed.frames.map(f=>f.rotation.velocity.raw);add(`${kind}: actual Lenis positive and negative speed`,Math.max(...velocities)>1&&Math.min(...velocities)<-1,{min:Math.min(...velocities),max:Math.max(...velocities),trustedWheel:speed.inputs.filter(e=>e.type==='wheel'&&e.trusted).length});
  if(kind!=='source'){const moving=speed.frames.filter(f=>Math.abs(f.rotation.velocity.current)>2);add('local: velocity contribution has no extra dt',moving.length>5&&moving.every(f=>Math.abs(f.rotation.yIncrement+f.rotation.dt*.5*f.rotation.worksRotate.value+f.rotation.velocity.current*.001)<1e-10),{frames:moving.length});const tail=speed.frames.at(-1);add('local: base rotation continues at stopped works',tail.rotation.phase==='works'&&tail.rotation.worksRotate.value===1&&tail.rotation.yIncrement<-.005,tail.rotation);}
  await shot(page,site,kind,'works');
}
async function lifecycle(page,site){
  await scroll(page,1900);await wait(page,1000);await move(page,840,400);await wait(page,200);await start(page);
  await page.getByRole('button',{name:'暂停动态',exact:true}).click();const paused=await read(page);
  await move(page,520,320);await move(page,940,640);await page.waitForTimeout(200);const during=await read(page);
  add('local: pause holds quaternion',paused.rotation.paused&&during.rotation.paused&&distance(paused.rotation.quaternion,during.rotation.quaternion)<1e-6,{paused,during});
  await page.getByRole('button',{name:'继续动态',exact:true}).click();await wait(page,300);const pause=await stop(page,site,'pause-move-resume');
  const resumed=pause.frames.find(f=>f.rotation.reset==='resume');add('local: resume clears accumulated input and preserves pose',resumed&&resumed.rotation.pointer.residual.every(v=>v===0)&&resumed.rotation.velocity.current===0&&resumed.rotation.euler.every(v=>v===0)&&distance(resumed.rotation.before,paused.rotation.quaternion)<1e-6,resumed);
  await start(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);await move(page,550,350);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await wait(page,400);const hidden=await stop(page,site,'simulated-document-hidden-visible');const wake=hidden.frames.find(f=>f.rotation.reset==='resume');add('local: visibility resume has zero input residual',wake&&wake.rotation.pointer.residual.every(v=>v===0),wake);
  await scroll(page,3700);await wait(page,1700);await page.locator('#entry-album').focus();const leaving=await read(page);await page.locator('#entry-album').click();await page.waitForURL('**/gallery/');await page.goBack({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__latest?.rotation&&document.body.dataset.homeStatus==='ready'&&!document.body.dataset.homeRestoring);
  const returned=await read(page);add('local: gallery back consumes existing initialization',returned.initialization.reason==='back-forward'&&returned.rotation.initialization===returned.initialization.revision&&returned.rotation.worksRotate.value===1&&returned.rotation.pointer.residual.every(v=>v===0)&&angle(returned.rotation.quaternion)<.1,{leaving,returned,focus:await page.evaluate(()=>document.activeElement?.id)});site.return={leaving,returned};await shot(page,site,'local','return');
}
async function mobileSeries(browser){
  const {page,site}=await pageFor(browser,'mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await start(page);await wait(page,5000);const still=await stop(page,site,'top-still-5s');add('mobile: top neutral without hover',still.frames.every(f=>!f.rotation.hover&&angle(f.rotation.quaternion)<1e-5),{frames:still.frames.length});
  await start(page);const cdp=await page.context().newCDPSession(page);
  for(let swipe=0;swipe<5;swipe++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:680}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:680-i*60}]});await wait(page,33);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(page,200);}
  await cdp.detach();await wait(page,400);const touch=await stop(page,site,'native-touch-swipes');add('mobile: actual touch scroll reaches works',touch.frames.some(f=>f.y>944&&f.rotation.phase==='works')&&touch.inputs.some(e=>e.type==='touchmove'&&e.trusted),{maxY:Math.max(...touch.frames.map(f=>f.y)),trustedTouch:touch.inputs.filter(e=>e.type==='touchmove'&&e.trusted).length});
  await scroll(page,1788);await wait(page,1200);await start(page);await wait(page,600);const works=await stop(page,site,'works-without-hover');add('mobile: base rotation and speed remain without hover',works.frames.every(f=>!f.rotation.hover&&f.rotation.pointer.weight===0)&&works.frames.some(f=>f.rotation.yIncrement<-.005)&&distance(works.frames[0].rotation.quaternion,works.frames.at(-1).rotation.quaternion)>.1,{first:works.frames[0],last:works.frames.at(-1)});await shot(page,site,'mobile','works');await page.close();
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LSSH_QA_BROWSER,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});report.browser=browser.version();
  try{
    for(const kind of ['source','local']){const {page,site}=await pageFor(browser,kind);console.log(kind+': ready');await mainSeries(page,site,kind);if(kind==='local')await lifecycle(page,site);await page.close();console.log(kind+': five samples saved');save();}
    await mobileSeries(browser);console.log('mobile: saved');
    const {page,site}=await pageFor(browser,'narrow-desktop',{viewport:{width:600,height:844}});await move(page,300,422);await wait(page,200);await start(page);await move(page,360,422);await wait(page,200);const narrow=await stop(page,site,'fine-pointer-at-narrow-width');add('narrow desktop: hover follows capability',narrow.frames.some(f=>f.rotation.hover&&f.rotation.pointer.weight>0&&Math.abs(f.rotation.pointer.residual[0])>0),{frames:narrow.frames.length});await page.close();
    const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:4321/personal-homepage/');await reduced.waitForFunction(()=>document.body.classList.contains('home-quiet'));add('reduced: native content and gallery link',await reduced.locator('#entry-album').getAttribute('href')==='/personal-homepage/gallery/'&&await reduced.getByRole('button',{name:'减少动画已启用'}).isDisabled(),{quiet:true,links:await reduced.locator('.home-cta').count()});await reduced.close();
    for(const [kind,site]of Object.entries(report.sites))add(kind+': no unexpected rotation/script errors',site.errors.every(error=>kind==='source'&&error==='Network request failed')&&site.segments.every(s=>s.frames.every(f=>f.rotation.quaternion.every(Number.isFinite))),{errors:site.errors,failed:site.failed,classification:kind==='source'?'Baseline external network error retained; not a local rotation error.':'All script errors must be absent.'});
  }catch(e){report.fatal=e.stack;console.error(e.stack);}finally{await browser.close();report.pass=!report.fatal&&report.checks.every(c=>c.pass);save();console.log(JSON.stringify({pass:report.pass,checks:report.checks.map(c=>({name:c.name,pass:c.pass})),fatal:report.fatal}));if(!report.pass)process.exitCode=1;}
})();
