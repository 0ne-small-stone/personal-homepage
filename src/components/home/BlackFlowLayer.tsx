import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { FramebufferTexture, LinearFilter, NoColorSpace, ShaderMaterial, Vector2 } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { BlackFlow, flowPassOrder } from './black-flow';
import type { JourneyModel } from './scene-state';
import type GlassGlow from './GlassGlow';
import { PRISM_LIGHT_LAYER } from './prism-ray';

interface Resources { flow: BlackFlow; color: FramebufferTexture; material: ShaderMaterial; quad: FullScreenQuad; disposed: boolean; }
function dispose(owned: Resources) { if (owned.disposed) return; owned.disposed = true; owned.flow.dispose(); owned.color.dispose(); owned.material.dispose(); owned.quad.dispose(); }
// One final render callback replaces R3F's automatic draw, including fallback.
export default function BlackFlowLayer({ model, hover, detailed, quiet, visible }: { model: JourneyModel; hover: boolean; detailed: boolean; quiet: boolean; visible: boolean }) {
  const { gl, size, invalidate, viewport } = useThree();
  const resources = useRef<Resources | null>(null), reason = useRef('initializing');
  const diagnostics = document.querySelector('[data-motion-diagnostics="true"]') !== null;
  const debug = useRef({ bypass: false, freeze: false, reset: false, forceZero: false, read: false, foregroundOnly: false });
  useEffect(() => {
    const context = gl.getContext();
    if (!hover || !detailed || quiet) { reason.current = !hover ? 'no-fine-hover' : !detailed ? 'low-quality' : 'reduced-or-paused'; invalidate(); return; }
    if (!context.getExtension('EXT_color_buffer_float') || !context.getExtension('OES_texture_float_linear')) { reason.current = 'float-unavailable'; invalidate(); return; }
    let owned: Resources | null = null;
    const old = gl.getRenderTarget();
    try {
      const flow = new BlackFlow(gl, size.width, size.height);
      const buffer = gl.getDrawingBufferSize(new Vector2());
      // Official GPU copy preserves the original screen's alpha blending and AA.
      const color = new FramebufferTexture(buffer.x, buffer.y);
      color.colorSpace = NoColorSpace; color.minFilter = color.magFilter = LinearFilter;
      const material = new ShaderMaterial({ toneMapped: false, depthTest: false, depthWrite: false, uniforms: { image: { value: color }, flow: { value: flow.texture }, amount: { value: 1 } },
        vertexShader: 'varying vec2 vUv; void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',
        fragmentShader: `uniform sampler2D image; uniform sampler2D flow; uniform float amount; varying vec2 vUv;
          void main(){vec2 v=texture2D(flow,vUv).xy*amount;vec3 color=texture2D(image,clamp(vUv+v*.01,0.,1.)).rgb;
          gl_FragColor=vec4(sRGBTransferEOTF(vec4(color,1.)).rgb*(1.+.8*length(v)),1.);
          #include <colorspace_fragment>
          }` });
      owned = { flow, color, material, quad: new FullScreenQuad(material), disposed: false };
      resources.current = owned; reason.current = 'ready';
    } catch (error) { if (owned) dispose(owned); reason.current = error instanceof Error ? error.message : 'flow-unavailable'; }
    finally { gl.setRenderTarget(old); }
    invalidate();
    return () => { resources.current = null; if (owned) dispose(owned); };
  }, [gl, size.width, size.height, viewport.dpr, hover, detailed, quiet, invalidate]);

  useEffect(() => {
    if (!diagnostics) return;
    const handler = (event: Event) => { Object.assign(debug.current, (event as CustomEvent).detail); invalidate(); };
    window.addEventListener('lssh:flow-control', handler);
    return () => window.removeEventListener('lssh:flow-control', handler);
  }, [diagnostics, invalidate]);

  // Hidden tabs may have no RAF at all; clear stale injection before waking.
  useEffect(() => { if (!visible) resources.current?.flow.suspend(model.pointer); }, [visible, model]);

  useFrame(({ scene, camera }, dt) => {
    const owned = resources.current;
    const wall = model.motion.phase === 'wall' || model.motion.phase === 'works_outro';
    const running = Boolean(owned && !quiet && visible && !wall);
    const old = { target: gl.getRenderTarget(), autoClear: gl.autoClear, layers: camera.layers.mask, xr: gl.xr.enabled, shadow: gl.shadowMap.autoUpdate };
    let probe = null;
    try {
      if (owned) {
        if (debug.current.reset) { owned.flow.clear(); debug.current.reset = false; }
        if (!debug.current.freeze) owned.flow.step(model.pointer, model.motion.initialization.revision, running, dt);
        if (diagnostics && debug.current.read) { probe = owned.flow.readback(); debug.current.read = false; }
      }
      gl.autoClear = true;
      // Local glass diffusion belongs below the foreground and in the same warp.
      camera.layers.set(0); gl.setRenderTarget(old.target); gl.render(scene, camera);
      const glassGlow = scene.userData.lsshGlassGlow as GlassGlow | undefined;
      if (!debug.current.foregroundOnly) glassGlow?.render(gl, camera);
      if (document.documentElement.dataset.motionDiagnostics === 'true') {
        const glow = glassGlow?.diagnostics();
        gl.domElement.dataset.glowActive = String(glow?.active ?? false);
        gl.domElement.dataset.glowIntensity = Number(glow?.intensity ?? 0).toFixed(3);
        gl.domElement.dataset.glowPasses = String(glow?.passes ?? 0);
        gl.domElement.dataset.glowError = String(glow?.error ?? '');
      }
      if (owned && running && !debug.current.bypass) {
        gl.copyFramebufferToTexture(owned.color);
        gl.setRenderTarget(old.target);
        owned.material.uniforms.flow.value = owned.flow.texture;
        owned.material.uniforms.amount.value = debug.current.forceZero ? 0 : 1;
        if (debug.current.foregroundOnly) gl.clear(); else owned.quad.render(gl);
      }
      // Wavelength-integrated light is composited over the world scene and
      // before the foreground cards, using the same renderer/context.
      (scene.userData.lsshSpectralTransport as { renderOverlay?: (renderer: typeof gl) => void } | undefined)?.renderOverlay?.(gl);
      // World-space light is not captured/refracted again, or hidden by glass depth.
      if (scene.userData.lsshPrismBeam?.active) {
        camera.layers.set(PRISM_LIGHT_LAYER); gl.autoClear = false; gl.render(scene, camera);
      }
      // Foreground cards are always last, including ordinary/paused rendering.
      camera.layers.set(1); gl.autoClear = false; gl.clearDepth(); gl.render(scene, camera);
    } catch (error) {
      // A broken optional flow layer must leave the existing scene usable.
      reason.current = error instanceof Error ? error.message : 'flow-render-failed';
      if (owned) { dispose(owned); resources.current = null; }
      camera.layers.mask = old.layers; gl.autoClear = true; gl.setRenderTarget(old.target); gl.render(scene, camera);
    } finally { camera.layers.mask = old.layers; gl.autoClear = old.autoClear; gl.xr.enabled = old.xr; gl.shadowMap.autoUpdate = old.shadow; gl.setRenderTarget(old.target); }
    if (diagnostics) window.dispatchEvent(new CustomEvent('lssh:flow', { detail: {
      time: performance.now(), frame: model.motion.frame, y: model.motion.scrollY, phase: model.motion.phase, initialization: model.motion.initialization,
      running, reason: reason.current, size: owned ? [owned.flow.width, owned.flow.height] : null, colorSize: owned ? [owned.color.image.width, owned.color.image.height] : null,
      capture: owned ? 'copyFramebufferToTexture' : 'direct', rendererState: { targetRestored: gl.getRenderTarget() === old.target, layers: camera.layers.mask, autoClear: gl.autoClear },
      type: owned?.flow.texture.type, filter: owned?.flow.texture.minFilter, wrap: owned?.flow.texture.wrapS,
      cycles: owned?.flow.cycles ?? 0, epoch: owned?.flow.epoch ?? 0, resets: owned?.flow.resets ?? 0,
      input: owned?.flow.last ?? null, order: flowPassOrder, probe, textures: gl.info.memory.textures, programs: gl.info.programs?.length,
      canvases: document.querySelectorAll('.home-scene canvas').length, control: { ...debug.current }, rotation: model.motion.glassRotation, cards: model.motion.cards,
    } }));
  }, 1);
  return null;
}
