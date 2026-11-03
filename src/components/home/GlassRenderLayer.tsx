import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, type Mesh } from 'three';
import GlassGlow from './GlassGlow';
import WallPortal from './WallPortal';
import LoadingReveal from './LoadingReveal';
import PointerFlow from './PointerFlow';
import {useThree} from '@react-three/fiber';
import {useRef} from 'react';
import type { JourneyModel } from './scene-state';

// Keep the single-canvas order: world/glass, local edge glow, then layer-1 cards.
// Single final compositor. Flow is optional, never a second priority-1 owner.
export default function GlassRenderLayer({model,quiet,flowEnabled}:{model:JourneyModel;quiet:boolean;flowEnabled:boolean}) {
  const flow=useMemo(()=>new PointerFlow(model),[model]);
  const {gl:renderer,size}=useThree();
  const blocked=useRef(false);
  useEffect(()=>{
    const sync=()=>{blocked.current=document.hidden||Boolean(document.querySelector('[data-home-guestbook] dialog[open]'));if(blocked.current)flow.interrupt(renderer,'hidden-or-dialog');model.invalidate();};
    const observer=new MutationObserver(sync);const dialog=document.querySelector('[data-home-guestbook] dialog');if(dialog)observer.observe(dialog,{attributes:true,attributeFilter:['open']});
    const hide=()=>{blocked.current=true;flow.interrupt(renderer,'pagehide');};
    document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',hide);window.addEventListener('pageshow',sync);
    sync();return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',sync);flow.dispose();};
  },[flow,model,renderer]);
  useEffect(()=>{if(!flowEnabled||quiet)flow.interrupt(renderer,'paused-or-loading');},[flowEnabled,quiet,flow,renderer]);
  const portal=useMemo(()=>new WallPortal(model),[model]);
  const opening=useMemo(()=>new LoadingReveal(),[model]);
  useEffect(()=>()=>{
    opening.dispose();
    if(document.body.classList.contains('has-journey')&&document.documentElement.dataset.motionDiagnostics==='true')document.body.dataset.homeLoadingPass=JSON.stringify(opening.diagnostics());
  },[opening]);
  const hiddenCap=useMemo(()=>new MeshBasicMaterial({visible:false}),[]);
  useEffect(()=>()=>portal.dispose(),[portal]);
  useEffect(()=>()=>hiddenCap.dispose(),[hiddenCap]);
  useFrame(({ gl, scene, camera }) => {
    const oldTarget = gl.getRenderTarget();
    const oldAutoClear = gl.autoClear;
    const oldLayers = camera.layers.mask;
    const oldXr = gl.xr.enabled;
    const oldShadow = gl.shadowMap.autoUpdate;
    const glass = scene.userData.lsshGlassMesh as Mesh | undefined;
    const originalGlassMaterial = glass?.material;
    // The portal already draws the front's content. Avoid shading a large
    // transmission cap underneath it; retain the same deformed bevel/side.
    if (glass && originalGlassMaterial && !quiet && model.motion.rendered.expand>.0001) {
      glass.material = [hiddenCap, Array.isArray(originalGlassMaterial) ? originalGlassMaterial[1] : originalGlassMaterial];
    }

    try {
      model.wallProbe?.start('initial-scene-compile');
      if(!model.loading.compiled){gl.compile(scene,camera);model.loading.compiled=true;model.loading.onCompiled?.();}
      model.wallProbe?.end('initial-scene-compile');
      // Finite known variants only, before their first interaction; no drawing
      // into the visible canvas or additional loading wait/animation clock.
      if(!quiet&&!blocked.current&&!document.hidden){portal.prepare(gl,scene,camera);portal.prepareWorks(gl,scene,camera);}
      model.wallProbe?.start('portal-capture-total');
      if(!quiet)portal.renderWall(gl,scene,camera);
      model.wallProbe?.end('portal-capture-total');
      gl.setRenderTarget(oldTarget);
      gl.autoClear = true;
      camera.layers.set(0);
      if(quiet||model.motion.rendered.expand>=.999)camera.layers.enable(2);
      model.wallProbe?.start('world-render');
      gl.render(scene, camera);
      model.wallProbe?.end('world-render');
      const drawn=gl.info.render.calls>0&&!gl.getContext().isContextLost();

      const glow = scene.userData.lsshGlassGlow as GlassGlow | undefined;
      if (glow) glow.coverageRequested = !quiet && model.motion.rendered.prepare > .001 && model.motion.rendered.expand < .999;
      model.wallProbe?.start('glow');glow?.render(gl, camera);model.wallProbe?.end('glow');
      portal.setGlassCoverage(glow?.coverageReady ? glow.coverageTexture : null);
      model.wallProbe?.start('portal-composite');if(!quiet)portal.composite(gl);model.wallProbe?.end('portal-composite');

      model.wallProbe?.start('flow');if(oldTarget===null)flow.render(gl,flowEnabled&&!quiet&&!blocked.current,size.width,size.height,glass,camera);model.wallProbe?.end('flow');

      if (model.motion.raw.prepare <= 0 && model.motion.rendered.prepare <= .001) {
        model.wallProbe?.start('cards-render');
        camera.layers.set(1);
        gl.autoClear = false;
        gl.clearDepth();
        gl.render(scene, camera);
        model.wallProbe?.end('cards-render');
      }
      if(model.loading.active&&oldTarget===null) {
        try {opening.render(gl,glow,model.loading.progress);}
        catch {model.loading.onSampleError?.();opening.dispose();}
      } else opening.dispose();
      if(drawn&&!model.loading.frameReady){model.loading.frameReady=true;model.loading.onFrame?.();}
      if(document.documentElement.dataset.motionDiagnostics==='true')document.body.dataset.homeLoadingPass=JSON.stringify({...opening.diagnostics(),glassId:glass?.uuid,geometryId:glass?.geometry.uuid,worldDrawn:drawn});
    } catch {
      // Recover the readable scene if the optional local glow pass fails.
      try {
        gl.setRenderTarget(oldTarget);
        gl.autoClear = true;
        camera.layers.set(0);
        camera.layers.enable(2);
        gl.render(scene, camera);
        if (model.motion.raw.prepare <= 0 && model.motion.rendered.prepare <= .001) {
          camera.layers.set(1);
          gl.autoClear = false;
          gl.clearDepth();
          gl.render(scene, camera);
        }
      } catch {
        // WebGL context loss is handled by HomeJourney's existing fallback.
      }
    } finally {
      if (glass && originalGlassMaterial) glass.material = originalGlassMaterial;
      camera.layers.mask = oldLayers;
      gl.autoClear = oldAutoClear;
      gl.xr.enabled = oldXr;
      gl.shadowMap.autoUpdate = oldShadow;
      gl.setRenderTarget(oldTarget);
    }
  }, 1);

  return null;
}
