// @ts-nocheck
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AddEquation, Camera, Color, CustomBlending, FloatType, Matrix4, Mesh, OneFactor, Scene,
  ShaderMaterial, Vector2, Vector3, Vector4, WebGLRenderTarget,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { BeamField, AIR_EXTINCTION, AIR_SCATTERING } from '../../lib/home-optics/beam-field.js';
import { ObserverField } from '../../lib/home-optics/observer-field.js';
import { makeReceiver, makeBackReceiver, ReceiverSurface } from '../../lib/home-optics/receiver.js';
import { SpectralObserver } from '../../lib/home-optics/spectral-observer.js';
import { SpectrumRender } from '../../lib/home-optics/spectral-render.js';
import { SpectralAtlas } from '../../lib/home-optics/spectral-atlas.js';
import { makeSpectrum, fusedSilicaIOR } from '../../lib/home-optics/spectral-science.js';
import { SourceDepth } from '../../lib/home-optics/source-depth.js';
import type { JourneyModel } from './scene-state';
import { prismOpticalOpacity } from './prism-visibility';

const MAX_TARGET_WIDTH = 960;
const MAX_TARGET_HEIGHT = 720;
const PREVIEW_BANDS = 8;
const PREVIEW_SOURCE_SAMPLES = 16;
const FINAL_BANDS = 16;
const SOURCE_SAMPLES = 64;
// Treat the spring's sub-pixel return tail as settled; real wheel/drag changes
// cross this bounded matrix-space tolerance and still invalidate the solve.
const POSE_EPSILON = 3e-4;
// A completed solve may trail the live pose by at most this matrix-component
// error; larger drift invalidates the solve. Active work is cancelled once per
// stale transition so a slowly returning prism cannot starve the next solve.
const REQUEST_DRIFT_EPSILON = .04;
const MOTION_REFRESH_MS = 420;
const SETTLE_MS = 280;

function poseKey(values: ArrayLike<number>) {
  let hash = 2166136261;
  for (let i = 0; i < values.length; i++) {
    hash = Math.imul(hash ^ Math.round(values[i] * 10000), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function maxPoseDelta(a: ArrayLike<number>, b: ArrayLike<number>) {
  let max = 0;
  for (let i = 0; i < a.length; i++) max = Math.max(max, Math.abs(a[i] - b[i]));
  return max;
}

type SpectralResources = {
  renderOverlay: (renderer: any) => void;
  dispose: () => void;
  suspend: () => void;
};

/**
 * Wavelength-resolved source, glass-interface and camera transport. The optical
 * passes share the homepage WebGLRenderer and are composited by BlackFlowLayer,
 * so the home scene still owns one canvas and one context.
 */
class HomeSpectralTransport implements SpectralResources {
  readonly scene: Scene;
  readonly field: InstanceType<typeof BeamField>;
  readonly surfaces: InstanceType<typeof ReceiverSurface>[];
  readonly receivers: ReturnType<typeof makeReceiver>[];
  readonly dummy: InstanceType<typeof ObserverField>;
  readonly observer: InstanceType<typeof SpectralObserver>;
  readonly pipeline: InstanceType<typeof SpectrumRender>;
  readonly atlas: InstanceType<typeof SpectralAtlas>;
  readonly depth: InstanceType<typeof SourceDepth>;
  readonly mask: Mesh;
  readonly bandTarget: WebGLRenderTarget;
  readonly overlayMaterial: ShaderMaterial;
  readonly overlay: FullScreenQuad;
  readonly worker: Worker;
  readonly workSize = new Vector2();
  readonly savedViewport = new Vector4();
  readonly savedScissor = new Vector4();
  readonly savedClear = new Color();
  epoch = 0;
  stage = 'idle';
  bands: ReturnType<typeof makeSpectrum> = [];
  pending: any[] = [];
  results: any[] = [];
  completed = 0;
  workerDone = false;
  dirty = true;
  active = false;
  overlayActive = false;
  tailReady = false;
  tailPreparing = false;
  disposed = false;
  error = '';
  lastPoseChange = 0;
  pose = new Float64Array(48);
  requestPose = new Float64Array(48);
  poseReady = false;
  currentPoseKey = '';
  requestPoseKey = '';
  completedPoseKey = '';
  completedEpoch = -1;
  requestEpoch = -1;
  poseError = 0;
  epochPrismMatrix = new Matrix4();
  epochPrism = { matrixWorld: this.epochPrismMatrix, visible: true };
  epochCamera: Camera | null = null;
  generation = 0;
  opacity = 0;
  previewReady = false;
  previewPose = new Float64Array(48);
  previewPoseKey = '';
  previewError = Infinity;
  lastPreviewRequest = -Infinity;
  previewCommittedAt = 0;

  constructor(readonly geometry: any, readonly gl: any, readonly invalidate: () => void) {
    this.scene = new Scene();
    this.scene.background = new Color(0x000000);
    this.field = new BeamField(geometry);
    this.scene.add(this.field.mesh);
    this.receivers = [makeReceiver(), makeBackReceiver()];
    this.surfaces = this.receivers.map(receiver => new ReceiverSurface(receiver, .009));
    this.surfaces.forEach(surface => this.scene.add(surface.mesh));
    this.dummy = new ObserverField();
    this.observer = new SpectralObserver(geometry, this.dummy);
    this.pipeline = new SpectrumRender(geometry, this.observer);
    this.atlas = new SpectralAtlas();
    this.depth = new SourceDepth(geometry);
    this.field.material.uniforms.sourceDepth.value = this.depth.target.texture;
    this.field.material.uniforms.sourceDepthEnabled.value = true;
    this.mask = new Mesh(geometry, this.pipeline.maskMaterial);
    this.mask.matrixAutoUpdate = false;
    this.scene.add(this.mask);
    this.bandTarget = new WebGLRenderTarget(1, 1, { type: FloatType, depthBuffer: true });
    this.observer.uniforms.hullPlanes.value = this.field.planeTexture;
    this.observer.uniforms.hullPlaneCount.value = this.field.planes.length;

    this.overlayMaterial = new ShaderMaterial({
      toneMapped: false,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneFactor,
      blendEquation: AddEquation,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneFactor,
      blendEquationAlpha: AddEquation,
      uniforms: {
        base: { value: this.pipeline.base.texture },
        previewBase: { value: this.pipeline.previewBase.texture },
        coarse: { value: this.pipeline.previewOptics.texture },
        native: { value: this.pipeline.native.texture },
        readyGroups: { value: 0 },
        size: { value: new Vector2(1, 1) },
        rect: { value: new Vector4(0, 0, 1, 1) },
        preview: { value: false },
        opacity: { value: 0 },
      },
      vertexShader: 'varying vec2 vUv; void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D base,previewBase,coarse,native;uniform int readyGroups;uniform vec2 size;uniform vec4 rect;uniform bool preview;uniform float opacity;varying vec2 vUv;
        void main(){if(opacity<=0.)discard;ivec2 p=ivec2(vUv*size);int tx=clamp(int(floor((float(p.x)-rect.x)/rect.z*2.)),0,1),ty=clamp(int(floor((float(p.y)-rect.y)/rect.w*2.)),0,1),group=tx+2*ty;
          vec3 xyz=preview?texture2D(previewBase,vUv).rgb:texture2D(base,vUv).rgb;
          vec3 light=(readyGroups&(1<<group))!=0?texture2D(native,vUv).rgb:texture2D(coarse,vUv).rgb;xyz+=light;
          vec3 rgb=vec3(dot(xyz,vec3(3.2406,-1.5372,-.4986)),dot(xyz,vec3(-.9689,1.8758,.0415)),dot(xyz,vec3(.0557,-.204,1.057)));
          rgb=clamp(max(rgb,vec3(0.))/.6,0.,1.)*opacity;gl_FragColor=vec4(rgb,0.);
          #include <colorspace_fragment>
        }`,
    });
    this.overlay = new FullScreenQuad(this.overlayMaterial);
    this.pipeline.onProgress = () => this.invalidate();
    this.worker = new Worker(new URL('../../lib/home-optics/spectral-worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }) => {
      if (this.disposed || data.epoch !== this.epoch || data.stage !== this.stage) return;
      if (data.done) this.workerDone = true;
      else this.pending.push(data);
      this.invalidate();
    };
    this.worker.onerror = event => {
      this.error = event.message || 'spectral-worker-failed';
      this.overlayActive = false;
      this.worker.terminate();
      this.invalidate();
    };
  }

  resize(drawWidth: number, drawHeight: number) {
    const scale = Math.min(1, MAX_TARGET_WIDTH / Math.max(1, drawWidth), MAX_TARGET_HEIGHT / Math.max(1, drawHeight));
    const width = Math.max(1, Math.round(drawWidth * scale));
    const height = Math.max(1, Math.round(drawHeight * scale));
    if (this.workSize.x === width && this.workSize.y === height) return;
    this.workSize.set(width, height);
    this.bandTarget.setSize(width, height);
    this.pipeline.resize(width, height);
    this.depth.resize(width, height);
    this.overlayMaterial.uniforms.size.value.set(width, height);
    this.previewReady = false;
    this.overlayActive = false;
    this.dirty = true;
    this.lastPoseChange = performance.now();
    this.lastPreviewRequest = -Infinity;
  }

  setActive(value: boolean, opacity: number) {
    const next = value && opacity > .001 && !this.error && !this.disposed;
    this.opacity = Math.max(0, Math.min(1, opacity));
    this.overlayMaterial.uniforms.opacity.value = this.opacity;
    if (this.active === next) return;
    this.active = next;
    if (!next) {
      this.cancel();
      this.overlayActive = false;
    } else {
      this.dirty = true;
      this.lastPoseChange = performance.now();
    }
  }

  observePose(prism: any, camera: any, now: number) {
    prism.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const current = [...prism.matrixWorld.elements, ...camera.matrixWorld.elements, ...camera.projectionMatrix.elements];
    const frameDelta = this.poseReady ? maxPoseDelta(current, this.pose) : Infinity;
    const moving = frameDelta > POSE_EPSILON;
    this.pose.set(current);
    this.poseReady = true;
    if (document.documentElement.dataset.motionDiagnostics === 'true') this.currentPoseKey = poseKey(this.pose);
    this.poseError = this.requestEpoch >= 0 ? maxPoseDelta(this.pose, this.requestPose) : 0;
    this.previewError = this.previewReady ? maxPoseDelta(this.pose, this.previewPose) : Infinity;
    if (moving) this.lastPoseChange = now;
    // Dirty means the current request no longer matches the live pose. The first
    // preview can therefore finish without being cancelled on every frame.
    this.dirty = this.requestEpoch < 0 || this.poseError > REQUEST_DRIFT_EPSILON;
    // Stop expensive final/native work as soon as it is clearly stale. Keep the
    // last valid preview visible until the replacement preview is ready.
    if (this.dirty && this.poseError > REQUEST_DRIFT_EPSILON &&
        ['final', 'native', 'done', 'preview-ready'].includes(this.stage)) this.cancel(true);
  }

  tick(prism: any, camera: any, opacity: number) {
    if (this.disposed) return;
    const now = performance.now();
    this.setActive(prism.visible, opacity);
    if (!this.active) return;
    this.observePose(prism, camera, now);
    const renderer = this.gl;
    const old = {
      target: renderer.getRenderTarget(), autoClear: renderer.autoClear, scissorTest: renderer.getScissorTest(),
      viewport: renderer.getViewport(this.savedViewport), scissor: renderer.getScissor(this.savedScissor),
      clear: renderer.getClearColor(this.savedClear).clone(), clearAlpha: renderer.getClearAlpha(), toneMapping: renderer.toneMapping,
    };
    try {
      // Keep a bounded cadence during rotation so the visible physical preview
      // follows the prism. Final sampling starts only after a short stable pause.
      if (this.dirty && (this.stage === 'idle' || now - this.lastPreviewRequest >= MOTION_REFRESH_MS)) {
        this.reset(prism, camera);
      }
      if (this.stage === 'preview-ready' && !this.dirty && this.poseError <= REQUEST_DRIFT_EPSILON &&
          now - this.lastPoseChange >= SETTLE_MS) this.sendStage('final', FINAL_BANDS);
      if (this.stage === 'preview' || this.stage === 'final') this.consumeSourceRows();
      else if (this.stage === 'preview-raster') this.renderPreview();
      else if (this.stage === 'native') this.renderNative();
      this.syncOverlay();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'spectral-render-failed';
      this.overlayActive = false;
      this.active = false;
      this.gl.domElement.dataset.spectralError = this.error;
      this.cancel();
    } finally {
      renderer.autoClear = old.autoClear;
      renderer.toneMapping = old.toneMapping;
      renderer.setRenderTarget(old.target);
      renderer.setScissorTest(old.scissorTest);
      renderer.setViewport(old.viewport);
      renderer.setScissor(old.scissor);
      renderer.setClearColor(old.clear, old.clearAlpha);
    }
    if (this.needsWork()) this.invalidate();
  }

  reset(prism: any, camera: any) {
    this.epoch++;
    this.worker.postMessage({ type: 'cancel' });
    this.requestEpoch = this.epoch;
    this.requestPose.set(this.pose);
    this.requestPoseKey = poseKey(this.requestPose);
    this.completedEpoch = -1;
    this.completedPoseKey = '';
    this.epochPrismMatrix.fromArray(this.requestPose, 0);
    this.epochPrism.visible = prism.visible;
    const snapshot = camera.clone() as Camera;
    snapshot.matrixWorld.fromArray(this.requestPose, 16);
    snapshot.matrix.copy(snapshot.matrixWorld);
    snapshot.matrixWorldInverse.copy(snapshot.matrixWorld).invert();
    snapshot.projectionMatrix.fromArray(this.requestPose, 32);
    snapshot.projectionMatrixInverse.copy(snapshot.projectionMatrix).invert();
    snapshot.matrixAutoUpdate = false;
    snapshot.matrixWorldAutoUpdate = false;
    snapshot.matrixWorldNeedsUpdate = false;
    this.epochCamera = snapshot;
    this.lastPreviewRequest = performance.now();
    this.pipeline.begin(this.gl, this.epochPrism, snapshot, this.previewReady);
    this.mask.matrix.copy(this.epochPrismMatrix);
    this.mask.visible = this.epochPrism.visible;
    this.observer.update(this.epochPrismMatrix, this.dummy, this.receivers, AIR_EXTINCTION, AIR_SCATTERING, fusedSilicaIOR(550));
    this.observer.uniforms.hasSource.value = true;
    this.observer.uniforms.flatIOR.value = false;
    this.depth.update(this.gl, this.epochPrism, snapshot);
    this.pending.length = 0;
    this.results.length = 0;
    this.completed = 0;
    this.workerDone = false;
    this.tailReady = false;
    this.tailPreparing = false;
    this.overlayActive = this.previewReady;
    this.overlayMaterial.uniforms.preview.value = true;
    this.stage = 'preview';
    this.dirty = false;
    this.sendStage('preview', PREVIEW_BANDS);
  }

  sendStage(name: string, count: number) {
    this.stage = name;
    // Continue showing the committed low-sample result while the final spectrum
    // is gathered. The full-resolution source replaces it only when available.
    if (name === 'final') this.overlayMaterial.uniforms.preview.value = true;
    this.bands = makeSpectrum(count);
    this.results = [];
    this.pending = [];
    this.completed = 0;
    this.workerDone = false;
    this.worker.postMessage({ epoch: this.requestEpoch, stage: name, bands: this.bands, matrix: this.poseMatrix(), glass: true, source: true,
      sourceSamplesPerBand: name === 'preview' ? PREVIEW_SOURCE_SAMPLES : SOURCE_SAMPLES, extinction: AIR_EXTINCTION });
  }

  poseMatrix() {
    // Every worker stage in one epoch uses the exact same immutable prism pose.
    return this.requestPose.slice(0, 16);
  }

  consumeSourceRows() {
    if (this.pending.length) {
      const row = this.pending.shift();
      this.upload(row);
      this.results[row.index] = row;
      this.completed++;
      this.gl.setRenderTarget(this.bandTarget);
      this.gl.setScissorTest(false);
      this.gl.render(this.scene, this.epochCamera!);
      this.pipeline.add(this.gl, this.bandTarget.texture, this.bands[row.index].xyz, this.stage === 'preview' ? this.pipeline.previewNextBase : this.pipeline.base);
      return;
    }
    if (this.workerDone && this.completed === this.bands.length && this.stage === 'preview') {
      this.atlas.build(this.results, this.bands);
      this.observer.useAtlas(this.atlas, this.bands, false, true);
      this.pipeline.startPreview(this.gl);
      this.stage = 'preview-raster';
      this.overlayMaterial.uniforms.preview.value = true;
      this.overlayMaterial.uniforms.previewBase.value = this.pipeline.previewBase.texture;
      this.overlayActive = true;
    } else if (this.workerDone && this.completed === this.bands.length && this.stage === 'final') {
      this.atlas.build(this.results, this.bands);
      this.observer.useAtlas(this.atlas, this.bands, false, true);
      this.overlayMaterial.uniforms.base.value = this.pipeline.base.texture;
      this.stage = 'native';
    }
  }

  upload(row: any) {
    this.field.records = [];
    this.field.receiverHits = [];
    for (let i = 0; i < row.recordCount; i++) {
      const v = row.beams.subarray(i * 8, i * 8 + 8);
      const start = new Vector3(v[0], v[1], v[2]), end = new Vector3(v[4], v[5], v[6]), receiverId = Math.round(v[7]) - 1;
      this.field.records.push({ a: start, b: end, power: v[3], receiverId });
      if (receiverId >= 0) {
        const direction = end.clone().sub(start).normalize(), power = v[3] * Math.exp(-AIR_EXTINCTION * start.distanceTo(end));
        this.field.receiverHits.push({ point: end, direction, power, cosine: Math.abs(direction.dot(this.receivers[receiverId].normal)), receiverId, receiver: this.receivers[receiverId] });
      }
    }
    this.field.uploadRecords(this.epochPrismMatrix, true, this.receivers);
    this.field.material.uniforms.sigmaS.value = AIR_SCATTERING;
    this.field.material.uniforms.sigmaT.value = AIR_EXTINCTION;
    this.surfaces.forEach((surface, i) => surface.update(this.field.receiverHits.filter(hit => hit.receiverId === i), AIR_EXTINCTION));
  }

  renderPreview() {
    if (this.pipeline.stepPreview(this.gl, this.epochCamera!, this.bands)) {
      this.pipeline.commitPreview();
      this.overlayMaterial.uniforms.preview.value = true;
      this.overlayMaterial.uniforms.previewBase.value = this.pipeline.previewBase.texture;
      this.previewPose.set(this.requestPose);
      this.previewPoseKey = this.requestPoseKey;
      this.previewError = maxPoseDelta(this.pose, this.previewPose);
      this.previewReady = true;
      this.previewCommittedAt = performance.now();
      this.dirty = this.previewError > REQUEST_DRIFT_EPSILON;
      this.overlayActive = true;
      this.stage = 'preview-ready';
    }
  }

  renderNative() {
    if (this.pipeline.group >= 4 && !this.tailReady && !this.tailPreparing) {
      void this.prepareTail(this.epochCamera!);
      return;
    }
    const nativePhase = this.pipeline.group < 4;
    const passes = nativePhase ? this.pipeline.nativePassesPerFrame : this.pipeline.tailPassesPerFrame;
    for (let pass = 0; pass < passes && this.pipeline.pendingReads.size < 6; pass++) {
      const before = `${this.pipeline.group}/${this.pipeline.band}/${this.pipeline.tail}`;
      this.pipeline.step(this.gl, this.epochCamera!, this.bands);
      if (before === `${this.pipeline.group}/${this.pipeline.band}/${this.pipeline.tail}`) break;
    }
    if (this.pipeline.nativeDone) {
      this.stage = 'done';
      this.overlayMaterial.uniforms.preview.value = false;
      this.completedEpoch = this.requestEpoch;
      this.completedPoseKey = this.requestPoseKey;
    }
  }

  async prepareTail(camera: any) {
    this.tailPreparing = true;
    const generation = this.epoch;
    const oldTarget = this.gl.getRenderTarget();
    const oldScissorTest = this.gl.getScissorTest(), oldAutoClear = this.gl.autoClear;
    const oldViewport = this.gl.getViewport(this.savedViewport), oldScissor = this.gl.getScissor(this.savedScissor);
    const oldClear = this.gl.getClearColor(this.savedClear).clone(), oldClearAlpha = this.gl.getClearAlpha();
    const begin = performance.now();
    try {
      for (const [scene, target] of [[this.pipeline.tailScene, this.pipeline.tailTarget], [this.pipeline.deltaScene, this.pipeline.native]]) {
        this.gl.setRenderTarget(target);
        const compile = this.gl.compileAsync(scene, camera);
        this.gl.setRenderTarget(oldTarget);
        await compile;
        if (this.disposed || generation !== this.epoch) return;
      }
      if (this.disposed || generation !== this.epoch) return;
      for (const [scene, target] of [[this.pipeline.tailScene, this.pipeline.tailTarget], [this.pipeline.deltaScene, this.pipeline.native]]) {
        const x = Math.floor(target.width / 2), y = Math.floor(target.height / 2);
        for (const name of ['position', 'finalPosition']) {
          const attribute = this.pipeline.tailGeometry.attributes[name];
          if (attribute) attribute.setXYZ(0, (x + .5) / target.width * 2 - 1, (y + .5) / target.height * 2 - 1, 0);
        }
        this.pipeline.tailGeometry.attributes.position.needsUpdate = true;
        this.pipeline.tailGeometry.attributes.finalPosition.needsUpdate = true;
        this.gl.setRenderTarget(target);
        this.gl.setScissor(x, y, 1, 1);
        this.gl.setScissorTest(true);
        this.gl.render(scene, camera);
        this.gl.setRenderTarget(oldTarget);
        this.gl.setScissorTest(oldScissorTest);
        const read = this.gl.readRenderTargetPixelsAsync(target, x, y, 1, 1, new Float32Array(4));
        await read;
        if (this.disposed || generation !== this.epoch) return;
      }
      this.pipeline.tailGeometry.attributes.position.setXYZ(0, 2, 2, 0);
      this.pipeline.tailGeometry.attributes.position.needsUpdate = true;
      this.tailReady = true;
      this.tailCompileMs = performance.now() - begin;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'spectral-tail-compile-failed';
      this.overlayActive = false;
      this.gl.domElement.dataset.spectralError = this.error;
    } finally {
      this.gl.autoClear = oldAutoClear;
      this.gl.setRenderTarget(oldTarget);
      this.gl.setViewport(oldViewport);
      this.gl.setScissor(oldScissor);
      this.gl.setScissorTest(oldScissorTest);
      this.gl.setClearColor(oldClear, oldClearAlpha);
      this.tailPreparing = false;
      if (!this.disposed && generation === this.epoch) this.invalidate();
    }
  }

  syncOverlay() {
    const u = this.overlayMaterial.uniforms;
    u.coarse.value = this.pipeline.previewOptics.texture;
    u.native.value = this.pipeline.native.texture;
    u.readyGroups.value = this.pipeline.readyGroups;
    u.rect.value.fromArray(this.pipeline.rect);
    if (this.previewReady && ['preview', 'preview-raster', 'preview-ready', 'final', 'native', 'done'].includes(this.stage)) this.overlayActive = true;
    else if (!this.previewReady) this.overlayActive = false;
    const stale = this.previewReady ? this.previewError : 0;
    const fade = this.previewReady ? 1 - Math.max(0, Math.min(1, (stale - .04) / .22)) : 0;
    u.opacity.value = this.opacity * (.18 + .82 * fade);
    this.gl.domElement.dataset.spectralStage = this.stage;
    if (document.documentElement.dataset.motionDiagnostics === 'true') {
      const canvas = this.gl.domElement;
      canvas.dataset.spectralEpoch = String(this.epoch);
      canvas.dataset.spectralDirty = String(this.dirty);
      canvas.dataset.spectralPose = this.currentPoseKey;
      canvas.dataset.spectralRequestEpoch = String(this.requestEpoch);
      canvas.dataset.spectralRequestPose = this.requestPoseKey;
      canvas.dataset.spectralCompletedEpoch = String(this.completedEpoch);
      canvas.dataset.spectralCompletedPose = this.completedPoseKey;
      canvas.dataset.spectralPoseError = this.poseError.toFixed(6);
      canvas.dataset.spectralPreviewError = Number.isFinite(this.previewError) ? this.previewError.toFixed(6) : 'inf';
      canvas.dataset.spectralPreviewAge = this.previewReady ? String(Math.round(performance.now() - this.previewCommittedAt)) : '-1';
      canvas.dataset.spectralPreviewPose = this.previewPoseKey;
      canvas.dataset.spectralOverlay = String(this.overlayActive);
      canvas.dataset.spectralOpacity = this.opacity.toFixed(3);
    }
  }

  renderOverlay(renderer: any) {
    if (!this.overlayActive || !this.active || this.disposed) return;
    const target = renderer.getRenderTarget(), autoClear = renderer.autoClear, scissorTest = renderer.getScissorTest();
    const viewport = renderer.getViewport(this.savedViewport), scissor = renderer.getScissor(this.savedScissor);
    try {
      renderer.setRenderTarget(target);
      renderer.setScissorTest(false);
      renderer.autoClear = false;
      this.overlay.render(renderer);
    } finally {
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(target);
      renderer.setScissorTest(scissorTest);
      renderer.setViewport(viewport);
      renderer.setScissor(scissor);
    }
  }

  needsWork() {
    return this.dirty || this.stage === 'preview-ready' || this.pending.length > 0 || this.stage === 'preview-raster' ||
      ((this.stage === 'preview' || this.stage === 'final') && this.workerDone && this.completed === this.bands.length) ||
      (this.stage === 'native' && this.pipeline.canStep());
  }

  cancel(preservePreview = false) {
    this.epoch++;
    this.worker?.postMessage({ type: 'cancel' });
    this.pending.length = 0;
    this.workerDone = false;
    this.stage = 'idle';
    this.dirty = true;
    this.overlayActive = preservePreview && this.previewReady;
    if (!this.overlayActive) this.previewReady = false;
    this.overlayMaterial.uniforms.preview.value = true;
    this.completedEpoch = -1;
    this.completedPoseKey = '';
    this.pipeline?.resetProgress();
  }

  suspend() { this.cancel(); this.overlayActive = false; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.worker.terminate();
    this.pipeline.dispose();
    this.observer.dispose();
    this.dummy.dispose();
    this.atlas.dispose();
    this.depth.dispose();
    this.field.dispose();
    this.surfaces.forEach(surface => surface.dispose());
    this.bandTarget.dispose();
    this.overlay.dispose();
    this.overlayMaterial.dispose();
  }
}

export default function SpectralTransport({ mesh, geometry, model }: { mesh: React.RefObject<Mesh | null>; geometry: any; model: JourneyModel }) {
  const { gl, camera, scene, size, invalidate } = useThree();
  const resources = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const context = gl.getContext();
    const floatTargets = Boolean(context.getExtension('EXT_color_buffer_float'));
    const floatLinear = Boolean(context.getExtension('OES_texture_float_linear'));
    const drawBuffers = context.getParameter(context.MAX_DRAW_BUFFERS);
    gl.domElement.dataset.spectralCapability = `${floatTargets}/${floatLinear}/${drawBuffers}`;
    if (!floatTargets || !floatLinear || drawBuffers < 4) return null;
    try { return new HomeSpectralTransport(geometry, gl, invalidate); }
    catch (error) { gl.domElement.dataset.spectralError = error instanceof Error ? error.message : 'spectral-init-failed'; return null; }
  }, [geometry, gl, invalidate]);
  useEffect(() => {
    if (!resources) return;
    (scene.userData.lsshSpectralTransport as SpectralResources | undefined)?.dispose();
    scene.userData.lsshSpectralTransport = resources;
    const buffer = gl.getDrawingBufferSize(new Vector2());
    resources.resize(buffer.x, buffer.y);
    const hidden = () => resources.suspend();
    const restored = () => { resources.dirty = true; resources.invalidate(); };
    const swap = () => resources.dispose();
    window.addEventListener('pagehide', hidden);
    window.addEventListener('pageshow', restored);
    document.addEventListener('astro:before-swap', swap);
    return () => {
      window.removeEventListener('pagehide', hidden);
      window.removeEventListener('pageshow', restored);
      document.removeEventListener('astro:before-swap', swap);
      if (scene.userData.lsshSpectralTransport === resources) delete scene.userData.lsshSpectralTransport;
      resources.dispose();
    };
  }, [gl, resources, scene]);
  useEffect(() => {
    if (!resources) return;
    const buffer = gl.getDrawingBufferSize(new Vector2());
    resources.resize(buffer.x, buffer.y);
    invalidate();
  }, [gl, invalidate, resources, size.width, size.height]);
  useFrame(() => {
    const prism = mesh.current;
    // A paused/reduced-motion scene still needs one static physical light pass;
    // only a hidden document should suspend all GPU/worker work.
    if (!resources || !prism || document.hidden) return;
    const opacity = prism.visible ? prismOpticalOpacity(model.motion.raw.wall) : 0;
    resources.tick(prism, camera, opacity);
  }, .5);
  return null;
}
