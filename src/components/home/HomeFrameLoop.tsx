import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Mesh } from 'three';
import { activeFrameDelta, FrameActivity } from './frame-activity';
import type { JourneyModel } from './scene-state';

export default function HomeFrameLoop({model,enabled}:{model:JourneyModel;enabled:boolean}) {
  const activity=useMemo(()=>new FrameActivity(),[]);
  const lastRunning=useRef(false),rawDelta=useRef(0);
  const canRun=useRef(enabled);canRun.current=enabled;
  const {invalidate,setFrameloop,get}=useThree();
  useEffect(()=>{
    const wake=()=>{activity.wake(performance.now());if(canRun.current&&get().frameloop!=='always')setFrameloop('always');invalidate();};
    model.invalidate=wake;
    const controller=new AbortController();
    // Lenis may consume wheel before a native scroll occurs. Wake on both.
    for(const type of ['wheel','touchstart','touchmove','scroll','keydown','click','focusin'])
      window.addEventListener(type,wake,{passive:true,capture:true,signal:controller.signal});
    wake();
    return()=>{controller.abort();if(model.invalidate===wake)model.invalidate=()=>{};delete document.body.dataset.homeFrameLoop;};
  },[activity,invalidate,model,setFrameloop,get]);
  useEffect(()=>{if(!enabled&&get().frameloop!=='demand')setFrameloop('demand');model.invalidate();},[enabled,model,setFrameloop,get]);
  useFrame((_,dt)=>{rawDelta.current=dt;model.frameDelta=activeFrameDelta(dt,!lastRunning.current);model.lastFrame=performance.now();},-4);
  useFrame(({camera,scene,gl,frameloop})=>{
    const now=performance.now(),motion=model.motion;
    const glass=scene.userData.lsshGlassMesh as Mesh|undefined;
    // Track glass inertia during input, but do not keep a stationary carousel
    // rendering for minutes solely for its very slow return-to-rest tail.
    // Camera/chapter/portal settling remains tracked until its actual end.
    const trackGlass=glass?.visible&&activity.inputActive(now);
    const values=[...camera.matrixWorld.elements,...camera.projectionMatrix.elements,
      ...(trackGlass?glass!.matrixWorld.elements:[]),...Object.values(motion.raw),...Object.values(motion.rendered),
      motion.scrollY,motion.initialization.revision,Number(motion.portalCovered),model.loading.progress];
    const busy=model.loading.active||motion.snapActive||Math.abs(motion.velocity)>.01;
    const running=enabled&&activity.advance(now,values,busy);
    lastRunning.current=running;
    // Use R3F's normal continuous clock during actual animation. Only switch
    // off after settling; visibility/quiet override the activity window.
    const mode=running?'always':'demand';
    if(frameloop!==mode)setFrameloop(mode);
    if(document.documentElement.dataset.motionDiagnostics==='true')document.body.dataset.homeFrameLoop=JSON.stringify({
      mode,running,frame:motion.frame,time:now,velocity:motion.velocity,snap:motion.snapActive,loading:model.loading.active,
      renderFrame:gl.info.render.frame,transmissionVisible:glass?(!Array.isArray(glass.material)&&glass.material.visible):null,
      trackingGlass:Boolean(trackGlass),
      rawDelta:rawDelta.current,delta:model.frameDelta,cpuMs:now-model.lastFrame});
  },2);
  return null;
}
