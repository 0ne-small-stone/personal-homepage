import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createJourneyModel, type JourneyModel } from './scene-state';
import GlassTriangle from './GlassTriangle';
import SceneLighting from './SceneLighting';
import SceneBackdrop from './SceneBackdrop';
import WorksScene from './WorksScene';
import WorksMotionDriver from './WorksMotionDriver';
import WorksIntroTitle from './WorksIntroTitle';
import { installWorksMotion } from './home-motion';
import 'lenis/dist/lenis.css';
import CameraRig from './CameraRig';
import AlbumScene from './AlbumScene';
import RisingWall from './RisingWall';
import { installHomeReturn } from './home-return';

class SceneBoundary extends Component<{children: ReactNode; onError: () => void}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function FirstFrame({ model, onReady }: {model: JourneyModel; onReady: () => void}) {
  const frames = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => { model.invalidate = invalidate; return () => {model.invalidate = () => {};}; }, [model,invalidate]);
  useFrame(() => {
    model.lastFrame = performance.now();
    if (frames.current < 3) { frames.current++; invalidate(); }
    if (frames.current === 3) { frames.current++; requestAnimationFrame(onReady); }
  });
  return null;
}

export default function HomeJourney({wordmarkUrl,photoUrl,projectUrl,neighborUrl}: {wordmarkUrl: string;photoUrl:string;projectUrl:string;neighborUrl:string}) {
  const model = useRef(createJourneyModel()).current;
  const [status,setStatus] = useState<'loading'|'ready'|'fallback'|'error'>(()=>{try{return sessionStorage.getItem('lssh.home.seen')==='true'?'ready':'loading';}catch{return 'loading';}});
  const [paused,setPaused] = useState(false);
  const [reduced,setReduced] = useState(false);
  const [mobile,setMobile] = useState(false);
  const [visible,setVisible] = useState(true);
  const [detailed,setDetailed] = useState(true);
  const [attempt,setAttempt] = useState(0);
  const ready = useRef(false);
  const loader = useRef<HTMLDivElement>(null);
  const [message,setMessage] = useState('');
  const [albumNear,setAlbumNear] = useState(false);
  const stopped = useRef(false);

  const onReady = () => {
    if (ready.current || stopped.current) return;
    ready.current = true;
    document.body.classList.add('home-enhanced');
    document.body.dataset.homeStatus = 'ready';
    if (loader.current && !reduced) {
      gsap.to(loader.current, {'--opening':'150%', duration:.65, ease:'power2.inOut', onComplete:()=>setStatus('ready')});
    } else setStatus('ready');
    try { sessionStorage.setItem('lssh.home.seen','true'); } catch { /* Storage is optional. */ }
  };
  const fallback = (error=false) => {
    ready.current = false;
    stopped.current = true;
    setStatus(error ? 'error' : 'fallback');
    document.body.classList.remove('home-enhanced');
    document.body.classList.add('home-static');
    document.body.dataset.homeStatus = error ? 'error' : 'fallback';
    setMessage(error ? '场景未能呈现，已切换为普通浏览。' : '普通浏览');
  };

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const touch = matchMedia('(pointer: coarse)');
    setReduced(media.matches); setMobile(touch.matches || innerWidth < 768);
    try { setPaused(sessionStorage.getItem('lssh.home.paused') === 'true'); } catch { /* Optional. */ }
    const preference = () => {setReduced(media.matches); model.invalidate();};
    const resize = () => {setMobile(touch.matches || innerWidth < 768); model.invalidate();};
    const visibility = () => setVisible(!document.hidden);
    const pageHide = () => setVisible(false);
    const pageShow = () => {setVisible(true); model.invalidate();};
    media.addEventListener('change',preference); window.addEventListener('resize',resize); document.addEventListener('visibilitychange',visibility); window.addEventListener('pagehide',pageHide); window.addEventListener('pageshow',pageShow);
    return () => {media.removeEventListener('change',preference); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('pagehide',pageHide); window.removeEventListener('pageshow',pageShow); gsap.killTweensOf(loader.current); document.body.classList.remove('home-enhanced','home-static','home-on-wall');};
  }, [model]);
  useEffect(installHomeReturn,[]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let previous = {x:0,y:0,time:0};
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const x = event.clientX / innerWidth * 2 - 1, y = -(event.clientY / innerHeight * 2 - 1), time = performance.now();
      const dt = Math.max(.016,(time-previous.time)/1000);
      model.pointer.x = x; model.pointer.y = y;
      model.pointer.vx = gsap.utils.clamp(-.21,.21,(x-previous.x)/dt*.02);
      model.pointer.vy = gsap.utils.clamp(-.21,.21,(y-previous.y)/dt*.02);
      previous = {x,y,time}; model.invalidate();
    };
    const leave = () => {model.pointer.x=0;model.pointer.y=0;};
    window.addEventListener('pointermove',pointer,{passive:true}); document.documentElement.addEventListener('pointerleave',leave);
    const timeout = window.setTimeout(()=>{if(!ready.current) fallback(true);},8000);
    return () => {clearTimeout(timeout);window.removeEventListener('pointermove',pointer);document.documentElement.removeEventListener('pointerleave',leave);};
  }, [model,attempt]);

  useEffect(() => {
    if(status !== 'ready' || paused || reduced) return;
    return installWorksMotion(model);
  }, [status, paused, reduced, model, attempt]);
  useEffect(() => {
    const near = () => { if(scrollY > innerHeight * 2.5 + 100) setAlbumNear(true); };
    window.addEventListener('scroll',near,{passive:true}); near();
    return () => window.removeEventListener('scroll',near);
  }, []);

  useEffect(()=>{
    document.body.classList.toggle('home-quiet',paused||reduced);
    if(paused||reduced)model.progress=0;
    ScrollTrigger.refresh();model.invalidate();
    return ()=>document.body.classList.remove('home-quiet');
  },[paused,reduced,model]);

  const togglePaused = () => {setPaused(value=>{try{sessionStorage.setItem('lssh.home.paused',String(!value));}catch{} return !value;}); model.invalidate();};
  const canRender = status !== 'error' && status !== 'fallback';
  return <>
    {canRender && <div className="home-scene" aria-hidden="true"><SceneBoundary key={attempt} onError={()=>fallback(true)}><Canvas frameloop={visible && !paused && !reduced ? 'always' : 'demand'} dpr={mobile ? 1 : [1,1.5]} camera={{position:[0,0,6],fov:40,near:.1,far:50}} gl={{alpha:false,antialias:true,powerPreference:'high-performance'}} onCreated={({gl})=>{
      gl.setClearColor('#000000');
      const lost=(event:Event)=>{event.preventDefault();fallback(true);};
      gl.domElement.addEventListener('webglcontextlost',lost,{once:true});
    }} fallback={<span>图形不可用</span>}>
      <Suspense fallback={null}><WorksMotionDriver model={model} /><CameraRig model={model} mobile={mobile} quiet={paused||reduced} /><SceneLighting /><SceneBackdrop model={model} mobile={mobile} /><GlassTriangle model={model} paused={paused||reduced} mobile={mobile} low={mobile} detailed={detailed} />{!paused&&!reduced&&<><WorksIntroTitle model={model} /><WorksScene model={model} projectUrl={projectUrl} neighborUrl={neighborUrl} /></>}<RisingWall model={model} /><FirstFrame model={model} onReady={onReady} /></Suspense>
      {albumNear&&<SceneBoundary onError={()=>{document.body.classList.remove('home-photo-ready');setMessage('影像加载失败，可继续浏览相册入口。');}}><Suspense fallback={null}><AlbumScene model={model} mobile={mobile} photoUrl={photoUrl} /></Suspense></SceneBoundary>}
    </Canvas></SceneBoundary></div>}
    {status === 'loading' && <div ref={loader} className="home-loader" role="status"><img className="home-loader-logo" src={wordmarkUrl} width="768" height="512" alt="Little Stone Still Here" /><p>正在准备光与玻璃</p><button onClick={()=>fallback()}>普通浏览</button></div>}
    <div className="home-scene-controls"><button className="home-sound" disabled aria-label="环境音尚未配置">声音未配置</button>{canRender&&<button className="home-quality" onClick={()=>{setDetailed(value=>!value);model.invalidate();}} aria-pressed={detailed}>光影细节</button>}<button onClick={togglePaused} disabled={reduced} aria-pressed={paused||reduced}>{reduced ? '减少动画已启用' : paused ? '继续动态' : '暂停动态'}</button>{status === 'error' && attempt < 1 && <button onClick={()=>{document.body.classList.remove('home-static');ready.current=false;stopped.current=false;setStatus('loading');setMessage('');setAttempt(value=>value+1);}}>重试场景</button>}</div>
    <p className="home-status" role="status">{message}</p>
  </>;
}
