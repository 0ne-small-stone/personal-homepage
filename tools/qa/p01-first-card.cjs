const {chromium}=require(process.env.LSSH_QA_PLAYWRIGHT || 'playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const final=process.env.LSSH_QA_FINAL==='1';
const out=path.resolve(`docs/design/iterations/evidence/u03-p01-2026-10-08-19/${final?'final':'confirm'}`);fs.mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sourceHash='b2bd0d964416bd3db61b1392d2b645314e50ea79cadb09f69755d5f4c3791853';
const report={date:new Date().toISOString(),conditions:{viewport:[1440,900],dpr:1,pointer:[720,450],renderer:'Chrome headless / SwiftShader',scope:'intro + first card; software timing is not a hardware benchmark'},sites:{},layout:[]};
function save(){fs.writeFileSync(path.join(out,'observations.json'),JSON.stringify(report,null,2));}
function init(){
  const enable=()=>{document.documentElement.dataset.motionDiagnostics='true';};
  if(document.documentElement)enable();else document.addEventListener('DOMContentLoaded',enable,{once:true});
  window.__qaTrace=[];window.__qaRecording=false;window.__qaInputs=[];
  window.addEventListener('wheel',e=>{if(window.__qaRecording)window.__qaInputs.push({time:performance.now(),delta:e.deltaY,trusted:e.isTrusted});},{capture:true,passive:true});
  window.__qaSample=s=>{window.__qaLatest=s;if(window.__qaRecording)window.__qaTrace.push(s);};
  document.addEventListener('lssh:motion',e=>window.__qaSample(e.detail));
}
const probe=String.raw`globalThis.__qaSample?.({time:performance.now(),scrollY:scrollY,velocity:lenis.velocity,height:innerHeight,raw:Object.fromEntries(['kv','works_intro','works_progress','works_event','works_snap'].map(k=>[k,topScrollManager.getTrigger(k)?.progress??null])),rendered:{progress:lerper.get('works_progress')?.current??0,index:lerper.get('works_current_index')?.current??0,intro:gl.sceneMain.bgQuadTree._commonUniforms.uWorksTitleProgress.value,background:lerper.get('bgQuadProgress')?.current??0},cards:gl.sceneThumbnail.topWorksThumbnail._worksThumbnails.slice(0,2).map((c,index)=>({index,position:c.position.toArray(),rotationY:c.rotation.y,scale:c.scale.x,alpha:c._commonUniforms.uAlpha.value,visible:c.visible,parentPosition:c.parent.position.toArray(),parentScale:c.parent.scale.x})),camera:{position:gl.sceneMain.camera.position.toArray(),fov:gl.sceneMain.camera.fov},titles:[...document.querySelectorAll('[data-works_item]')].slice(0,2).map(e=>({opacity:Number(getComputedStyle(e).opacity),visibility:getComputedStyle(e).visibility,title:e.querySelector('[data-works_title]')?.textContent}))});`;
async function read(p,kind){return p.evaluate(kind=>({sample:window.__qaLatest,dom:{t:performance.now(),scrollY,status:document.body.dataset.homeStatus,canvas:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth>innerWidth,titles:[...document.querySelectorAll(kind!=='source'?'[data-work-item]':'[data-works_item]')].slice(0,2).map(e=>{const c=kind!=='source'?e.querySelector('.home-chapter-viewport'):e,h=e.querySelector(kind!=='source'?'h2':'[data-works_title]'),a=e.querySelector('a'),rect=a?.getBoundingClientRect();return {id:e.id,title:h?.textContent,inert:e.inert,ariaHidden:e.getAttribute('aria-hidden'),active:e.dataset.workActive,opacity:Number(getComputedStyle(c).opacity),visibility:getComputedStyle(c).visibility,firstChar:h?.firstElementChild?{opacity:getComputedStyle(h.firstElementChild).opacity,transform:getComputedStyle(h.firstElementChild).transform}:null,cta:a?{href:a.href,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},hit:(()=>{const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);return hit===a||a.contains(hit);})()}:null};})}}),kind);}
async function shot(p,kind,name,guide=false){
  if(guide)await p.evaluate(()=>{const div=document.createElement('div');div.id='qa-guide';div.style.cssText='position:fixed;inset:0;z-index:1000;pointer-events:none;background:linear-gradient(90deg,transparent calc(50% - .5px),#fa6464 calc(50% - .5px),#fa6464 calc(50% + .5px),transparent calc(50% + .5px)),linear-gradient(transparent calc(50% - .5px),#fa6464 calc(50% - .5px),#fa6464 calc(50% + .5px),transparent calc(50% + .5px))';document.body.append(div);});
  const file=`${kind}-${name}.png`;await p.screenshot({path:path.join(out,file)});const state=await read(p,kind);
  if(guide)await p.evaluate(()=>document.getElementById('qa-guide')?.remove());return {file,...state};
}
async function reset(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(2100);}
async function milestone(p,kind,label,y){
  await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);let start=Date.now();const samples=[];
  for(const ms of [0,250,1000,2000]){await sleep(Math.max(0,ms-(Date.now()-start)));samples.push({requestedMs:ms,elapsedMs:Date.now()-start,...await read(p,kind)});}
  return {label,requestedY:y,samples,frame:await shot(p,kind,label)};
}
async function dynamic(p,kind,name,table){
  await reset(p,1000);await p.evaluate(()=>{window.__qaTrace=[];window.__qaInputs=[];window.__qaRecording=true;});
  const cdp=await p.context().newCDPSession(p);
  const start=Date.now(),inputs=[],frames=[];let done=false;
  let i=0;const pending=[];
  cdp.on('Page.screencastFrame',event=>{cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId});const file=`${kind}-${name}-${String(i++).padStart(2,'0')}.jpg`;fs.writeFileSync(path.join(out,file),Buffer.from(event.data,'base64'));const elapsedMs=Date.now()-start;pending.push(read(p,kind).then(state=>frames.push({file,elapsedMs,cdpTimestamp:event.metadata.timestamp,...state})));});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:70,maxWidth:1440,maxHeight:900,everyNthFrame:3});
  await Promise.all(table.map(e=>new Promise(resolve=>setTimeout(()=>{inputs.push({...e,actualMs:Date.now()-start});cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:720,y:450,deltaX:0,deltaY:e.delta}).then(resolve);},Math.max(0,e.ms-(Date.now()-start))))));
  await sleep(2100);await cdp.send('Page.stopScreencast');await Promise.all(pending);await cdp.detach();
  const final=await p.evaluate(()=>{window.__qaRecording=false;return {readings:window.__qaTrace,receivedInputs:window.__qaInputs};});
  frames.sort((a,b)=>a.elapsedMs-b.elapsedMs);return {name,startY:1000,eventTable:table,inputs,frames,...final};
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LSSH_QA_BROWSER,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-sandbox']});report.browser=browser.version();
  try{
    for(const kind of (final?['local']:['source','local'])){
      const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});await page.addInitScript(init);
      const site={errors:[],points:[],boundaries:[],dynamic:[]};report.sites[kind]=site;
      page.on('pageerror',e=>site.errors.push(e.message));
      if(kind==='source')await page.route('**/index.astro_astro_type_script_index_0_lang.*.js',async route=>{
        const res=await route.fetch(),body=await res.body();site.bundle={url:res.url(),bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex')};
        if(site.bundle.sha256!==sourceHash)throw new Error('Original bundle changed; probe must be reverified');
        const code=body.toString('utf8'),needle='lenis.raf(l);const i=gl.update();lerper.update(l)';
        if(code.split(needle).length!==2)throw new Error('Probe anchor is not unique');
        await route.fulfill({response:res,body:code.replace(needle,'lenis.raf(l);const i=gl.update();'+probe+'lerper.update(l)')});
      });
      await page.goto(kind==='source'?'https://alche.studio/':'http://127.0.0.1:4321/personal-homepage/',{waitUntil:'domcontentloaded',timeout:60000});
      if(kind==='source'){await sleep(7500);if(await page.locator('[data-sound-intro-decline]').isVisible())await page.locator('[data-sound-intro-decline]').click();await sleep(2500);}
      else await page.waitForFunction(()=>document.body.dataset.homeStatus==='ready',{timeout:20000});
      await page.waitForFunction(()=>window.__qaLatest?.cards?.length>0,null,{timeout:60000});await page.mouse.move(720,450);await sleep(1500);
      site.hero=await shot(page,kind,'hero-center',kind==='local');console.log(`${kind}: ready`);save();
      for(const y of [100,325,550,775,1000,1225,1450,1675,1900]){site.points.push(await milestone(page,kind,`point-${y}`,y));console.log(`${kind}: ${y}`);save();}
      for(const [label,from,to] of [['forward-below',1400,1449],['forward-above',1400,1451],['reverse-above',1500,1451],['reverse-below',1500,1449]]){await reset(page,from);site.boundaries.push(await milestone(page,kind,label,to));}save();
      await reset(page,1900);site.center=await shot(page,kind,'first-card-center',kind==='local');
      const tables={slow:Array.from({length:18},(_,i)=>({ms:i*100,delta:50})),fast:[{ms:0,delta:900}],reverse:[{ms:0,delta:900},{ms:220,delta:-900}]};
      for(const [name,table] of Object.entries(tables)){site.dynamic.push(await dynamic(page,kind,name,table));console.log(`${kind}: ${name} trace`);save();}
      if(kind==='local'){
        await reset(page,1900);await page.locator('#entry-projects').focus();site.keyboardBefore=await read(page,kind);
        await page.locator('#entry-projects').click();site.destination={url:page.url(),heading:await page.locator('h1').innerText()};
        await page.goBack({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.dataset.homeStatus==='ready',{timeout:20000});await sleep(2300);
        site.return={...await read(page,kind),focus:await page.evaluate(()=>document.activeElement?.id),loader:await page.locator('.home-loader').count()};
        site.returnFrame=await shot(page,kind,'return');
        await page.keyboard.press('Tab');site.nextFocus=await page.evaluate(()=>({id:document.activeElement?.id,text:document.activeElement?.textContent}));
      }
      await page.close();save();
    }
    for(const spec of [{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'reduced',viewport:{width:1440,height:900},reducedMotion:'reduce'},{name:'no-js',viewport:{width:390,height:844},javaScriptEnabled:false},...(!final?[{name:'desktop-front-control',viewport:{width:1440,height:900},neutral:true},{name:'mobile-front-control',viewport:{width:390,height:844},isMobile:true,hasTouch:true,neutral:true}]:[])]){
      const page=await browser.newPage({...spec,deviceScaleFactor:1});await page.addInitScript(init);const errors=[];page.on('pageerror',e=>errors.push(e.message));
      if(spec.neutral)await page.route('**/HomeJourney.*.js',async route=>{const res=await route.fetch(),code=await res.text(),matches=code.match(/[a-z]+\.current\.quaternion\.slerp\([^;]+?\),/g);if(matches?.length!==1)throw Error('Neutral test control anchor must be unique');const anchor=matches[0];await route.fulfill({response:res,body:code.replace(anchor,anchor.slice(0,anchor.indexOf('.quaternion'))+'.quaternion.identity(),')});});
      await page.goto('http://127.0.0.1:4321/personal-homepage/',{waitUntil:'domcontentloaded'});if(spec.javaScriptEnabled!==false)await page.waitForFunction(()=>document.body.dataset.homeStatus==='ready',{timeout:20000});await sleep(600);
      const hero=await shot(page,spec.name,'hero',spec.name==='mobile');
      await page.evaluate(()=>scrollTo({top:document.getElementById('projects').offsetTop,behavior:'instant'}));await sleep(2200);const card=await shot(page,spec.name,'card',spec.name==='mobile');
      report.layout.push({name:spec.name,neutral:!!spec.neutral,errors,hero,card,classes:await page.evaluate(()=>document.body.className)});await page.close();save();console.log(`layout: ${spec.name}`);
    }
  }catch(e){report.fatal=e.stack;console.error(e.stack);}finally{await browser.close();save();console.log('DONE '+out);}
})();
