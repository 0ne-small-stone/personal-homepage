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
import { installWorksMotion } from './home-motion';
import 'lenis/dist/lenis.css';
import CameraRig from './CameraRig';
import RisingWall from './RisingWall';
import { installHomeReturn } from './home-return';
import GlassRenderLayer from './GlassRenderLayer';
import { initialHomeQuiet, useHomeLoading } from './useHomeLoading';

class SceneBoundary extends Component<{children: ReactNode; onError: () => void}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch(error: Error) { console.warn('首页场景加载失败：', error.message); this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function CanvasContextEvents({ onError }: { onError: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onError]);
  return null;
}

function FrameHeartbeat({ model }: {model: JourneyModel}) {
  const frames = useRef(0);
  const { invalidate } = useThree();
  useEffect(() => { model.invalidate = invalidate; return () => {model.invalidate = () => {};}; }, [model,invalidate]);
  useFrame(() => {
    model.lastFrame = performance.now();
    if (frames.current < 3) { frames.current++; invalidate(); }
  });
  return null;
}

export default function HomeJourney({wordmarkUrl,albumUrl,projectUrl,neighborUrl}: {wordmarkUrl: string;albumUrl:string;projectUrl:string;neighborUrl:string}) {
  const model = useRef(createJourneyModel()).current;
  const ownerBody = useRef(document.body);
  const [paused,setPaused] = useState(()=>initialHomeQuiet().paused);
  const [portalPaused,setPortalPaused]=useState(false);
  const [reduced,setReduced] = useState(()=>initialHomeQuiet().reduced);
  const quiet=reduced||(paused&&!portalPaused);
  const [mobile,setMobile] = useState(false);
  const [hover,setHover] = useState(false);
  const [visible,setVisible] = useState(() => !document.hidden);
  const [attempt,setAttempt] = useState(0);
  const loading=useHomeLoading(model,wordmarkUrl,attempt,quiet);
  const status=loading.phase,message=loading.message,fallback=loading.fallback;
  const canRender=status!=='error'&&status!=='fallback';

  useEffect(() => {
    if (new URLSearchParams(location.search).has('opticsDebug')) document.documentElement.dataset.motionDiagnostics = 'true';
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const touch = matchMedia('(pointer: coarse)');
    const hoverMedia = matchMedia('(hover: hover) and (pointer: fine)');
    setReduced(initialHomeQuiet().reduced); setMobile(touch.matches || innerWidth < 768); setHover(hoverMedia.matches);
    try { setPaused(sessionStorage.getItem('lssh.home.paused') === 'true'); } catch { /* Optional. */ }
    const preference = () => {setReduced(media.matches); model.invalidate();};
    const resize = () => {setMobile(touch.matches || innerWidth < 768); setHover(hoverMedia.matches); model.invalidate();};
    const visibility = () => setVisible(!document.hidden);
    const pageHide = () => setVisible(false);
    const pageShow = () => {setVisible(true); model.invalidate();};
    media.addEventListener('change',preference); hoverMedia.addEventListener('change',resize); window.addEventListener('resize',resize); document.addEventListener('visibilitychange',visibility); window.addEventListener('pagehide',pageHide); window.addEventListener('pageshow',pageShow);
    return () => {media.removeEventListener('change',preference); hoverMedia.removeEventListener('change',resize); window.removeEventListener('resize',resize); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('pagehide',pageHide); window.removeEventListener('pageshow',pageShow); ownerBody.current.classList.remove('home-enhanced','home-static','home-on-wall');};
  }, [model]);
  useEffect(installHomeReturn,[]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (model.loading.active) return;
      const x = event.clientX / innerWidth * 2 - 1, y = -(event.clientY / innerHeight * 2 - 1);
      model.pointer.x = x; model.pointer.y = y;
      if (!model.pointer.active) { model.pointer.active = true; model.pointer.revision++; }
      model.invalidate();
    };
    const leave = () => {model.pointer.active=false; model.invalidate();};
    window.addEventListener('pointermove',pointer,{passive:true}); document.documentElement.addEventListener('pointerleave',leave); window.addEventListener('blur',leave);
    return () => {window.removeEventListener('pointermove',pointer);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);};
  }, [model,attempt]);

  useEffect(() => {
    if(!canRender)return;
    if(quiet){loading.layoutReady();return;}
    const dispose=installWorksMotion(model);loading.layoutReady();return dispose;
  }, [canRender, quiet, model, attempt]);

  useEffect(()=>{
    ownerBody.current.classList.toggle('home-quiet',quiet);
    if(quiet)model.progress=0;
    ScrollTrigger.refresh();model.invalidate();
    return ()=>ownerBody.current.classList.remove('home-quiet');
  },[quiet,model]);

  const togglePaused = () => {
    setPortalPaused(!paused&&model.motion.rendered.prepare>.001);
    setPaused(value=>{try{sessionStorage.setItem('lssh.home.paused',String(!value));}catch{} return !value;});model.invalidate();
  };
  return <>
    {canRender && <div className="home-scene" aria-hidden="true"><SceneBoundary key={attempt} onError={()=>fallback(true)}><Canvas frameloop={visible && !paused && !reduced && status!=='waiting'&&!loading.previewHeld ? 'always' : 'demand'} dpr={mobile ? 1 : [1,1.5]} camera={{position:[0,0,6],fov:40,near:.1,far:50}} gl={{alpha:false,antialias:true,powerPreference:'high-performance'}} onCreated={({gl})=>{
      gl.setClearColor('#000000');
    }} fallback={<span>图形不可用</span>}>
      <CanvasContextEvents onError={()=>fallback(true)} />
      <Suspense fallback={null}><WorksMotionDriver model={model} stopped={paused&&portalPaused} /><CameraRig model={model} mobile={mobile} quiet={quiet} frozen={paused&&portalPaused} /><SceneLighting /><SceneBackdrop model={model} mobile={mobile} /><GlassTriangle model={model} paused={quiet||!visible||loading.active} frozen={paused&&portalPaused} hover={hover} mobile={mobile} />{!quiet&&<Suspense fallback={null}><WorksScene model={model} projectUrl={projectUrl} neighborUrl={neighborUrl} albumUrl={albumUrl} /></Suspense>}<RisingWall model={model} quiet={quiet} /><FrameHeartbeat model={model} /><GlassRenderLayer model={model} quiet={quiet} /></Suspense>
    </Canvas></SceneBoundary></div>}
    {loading.active&&<div className="home-loader" aria-label="首页加载"><p role="status">{status==='waiting'?'正在载入':'空间正在显现'}</p><button onClick={()=>fallback()}>普通浏览</button></div>}
    {loading.preview==='1'&&loading.active&&<div className="home-loading-lab" aria-label="本机加载预览"><span>本机加载预览</span><button disabled={!loading.wordmarkDecoded} onClick={loading.start}>开始揭幕</button><button disabled={!loading.wordmarkDecoded} onClick={()=>loading.seek(.16)}>轮廓</button><button disabled={!loading.wordmarkDecoded} onClick={()=>loading.seek(.55)}>展开</button><button disabled={!loading.wordmarkDecoded} onClick={()=>loading.seek(1)}>完成</button></div>}
    <div className="home-scene-controls"><button className="home-sound" disabled aria-label="环境音尚未配置">声音未配置</button><button onClick={togglePaused} disabled={reduced} aria-pressed={paused||reduced}>{reduced ? '减少动画已启用' : paused ? '继续动态' : '暂停动态'}</button>{status === 'error' && attempt < 1 && <button onClick={()=>setAttempt(value=>value+1)}>重试场景</button>}</div>
    <p className="home-status" role="status">{message}</p>
  </>;
}
