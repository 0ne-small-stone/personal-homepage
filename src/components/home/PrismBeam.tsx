import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DoubleSide, DynamicDrawUsage, MathUtils, Matrix4, Mesh, ShaderMaterial, Vector2, Vector3, type Camera } from 'three';
import type { JourneyModel } from './scene-state';
import { MAX_INTERFACES, PRISM_INCIDENT_SLOPE, PRISM_LIGHT_LAYER, PrismRaySolver } from './prism-ray';

class WhiteLight {
  readonly solver: PrismRaySolver;
  readonly geometry = new BufferGeometry();
  readonly material = new ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: DoubleSide,
    uniforms: { resolution: { value: new Vector2() }, intensity: { value: 0 }, halfWidth: { value: 4 } },
    vertexShader: `attribute vec3 start;attribute vec3 end;attribute vec2 corner;attribute float strength;
      uniform vec2 resolution;uniform float halfWidth;varying float lateral;varying float energy;
      void main(){vec4 a=projectionMatrix*viewMatrix*vec4(start,1.);vec4 b=projectionMatrix*viewMatrix*vec4(end,1.);
        vec2 delta=(b.xy/b.w-a.xy/a.w)*resolution;vec2 tangent=delta/max(length(delta),.00001);
        vec4 clip=mix(a,b,corner.x);clip.xy+=vec2(-tangent.y,tangent.x)*corner.y*halfWidth*2./resolution*clip.w;
        lateral=corner.y;energy=strength;gl_Position=clip;}`,
    fragmentShader: `uniform float intensity;varying float lateral;varying float energy;
      void main(){float alpha=exp(-6.5*lateral*lateral)*energy*intensity;gl_FragColor=vec4(vec3(1.),alpha);
        #include <colorspace_fragment>
      }` });
  readonly mesh = new Mesh(this.geometry, this.material);
  active = false;
  disposed = false;
  solves = 0;
  lastCpuMs = 0;
  totalCpuMs = 0;
  maxCpuMs = 0;
  private readonly previous = new Matrix4().makeScale(0, 0, 0);
  private readonly origin = new Vector3(-12, -12 * PRISM_INCIDENT_SLOPE, 0);
  private readonly direction = new Vector3(1, PRISM_INCIDENT_SLOPE, 0).normalize();
  private readonly starts = new Float32Array((MAX_INTERFACES + 1) * 6 * 3);
  private readonly ends = new Float32Array(this.starts.length);
  private readonly corners = new Float32Array((MAX_INTERFACES + 1) * 6 * 2);
  private readonly energy = new Float32Array((MAX_INTERFACES + 1) * 6);
  private readonly a = new Vector3();
  private readonly b = new Vector3();
  private readonly forward = new Vector3();
  private readonly cameraPosition = new Vector3();
  private readonly delta = new Vector3();
  private readonly attributeStart = new BufferAttribute(this.starts, 3).setUsage(DynamicDrawUsage);
  private readonly attributeEnd = new BufferAttribute(this.ends, 3).setUsage(DynamicDrawUsage);
  private segments = 0;

  constructor(geometry: BufferGeometry) {
    this.solver = new PrismRaySolver(geometry);
    const corners = [0, -1, 1, -1, 0, 1, 0, 1, 1, -1, 1, 1];
    for (let i = 0; i <= MAX_INTERFACES; i++) this.corners.set(corners, i * 12);
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.starts.length), 3));
    this.geometry.setAttribute('start', this.attributeStart); this.geometry.setAttribute('end', this.attributeEnd);
    this.geometry.setAttribute('corner', new BufferAttribute(this.corners, 2));
    this.geometry.setAttribute('strength', new BufferAttribute(this.energy, 1).setUsage(DynamicDrawUsage));
    this.mesh.layers.set(PRISM_LIGHT_LAYER); this.mesh.frustumCulled = false;
    this.mesh.name = 'lssh-prism-white-light'; this.mesh.userData.lsshPrismLight = true;
    this.geometry.setDrawRange(0, 0);
  }

  update(source: Mesh, camera: Camera, width: number, height: number, intensity: number) {
    if (this.disposed) return;
    this.material.uniforms.intensity.value = intensity;
    this.material.uniforms.resolution.value.set(width, height);
    this.active = source.visible && intensity > .0001;
    this.mesh.visible = this.active;
    if (!this.active) { this.geometry.setDrawRange(0, 0); return; }
    source.updateWorldMatrix(true, false);
    if (!this.previous.equals(source.matrixWorld)) {
      const start = performance.now(); this.solver.trace(source.matrixWorld, this.origin, this.direction);
      this.lastCpuMs = performance.now() - start; this.totalCpuMs += this.lastCpuMs; this.maxCpuMs = Math.max(this.maxCpuMs, this.lastCpuMs); this.solves++;
      this.previous.copy(source.matrixWorld);
    }
    // Only display length is clipped at the camera near plane; physics remains world-space.
    camera.getWorldDirection(this.forward); camera.getWorldPosition(this.cameraPosition);
    const near = 'near' in camera ? Number(camera.near) + .001 : .101;
    this.segments = 0;
    for (let i = 0; i < this.solver.count - 1; i++) {
      this.a.copy(this.solver.points[i]); this.b.copy(this.solver.points[i + 1]);
      const da = this.delta.copy(this.a).sub(this.cameraPosition).dot(this.forward) - near;
      const db = this.delta.copy(this.b).sub(this.cameraPosition).dot(this.forward) - near;
      if (da <= 0 && db <= 0) continue;
      if (da <= 0) this.a.lerp(this.b, da / (da - db));
      else if (db <= 0) this.b.lerp(this.a, db / (db - da));
      const segment = this.segments++;
      for (let vertex = 0; vertex < 6; vertex++) {
        this.a.toArray(this.starts, (segment * 6 + vertex) * 3); this.b.toArray(this.ends, (segment * 6 + vertex) * 3);
        this.energy[segment * 6 + vertex] = i === 0 ? .85 : this.solver.status === 'exited' && i === this.solver.count - 2 ? .78 : .65;
      }
    }
    this.attributeStart.needsUpdate = true; this.attributeEnd.needsUpdate = true;
    this.geometry.getAttribute('strength').needsUpdate = true;
    this.geometry.setDrawRange(0, this.segments * 6);
  }

  diagnostics() {
    return { ...this.solver.diagnostics(), incident: { origin: this.origin.toArray(), direction: this.direction.toArray() }, active: this.active, intensity: this.material.uniforms.intensity.value, segments: this.segments, vertices: this.geometry.drawRange.count, layer: this.mesh.layers.mask, depthTest: this.material.depthTest, disposed: this.disposed, solves: this.solves, cpuMs: { last: this.lastCpuMs, mean: this.solves ? this.totalCpuMs / this.solves : 0, max: this.maxCpuMs }, geometry: this.geometry.uuid, material: this.material.uuid };
  }
  suspend() { this.active = false; this.mesh.visible = false; this.material.uniforms.intensity.value = 0; }
  dispose() { if (this.disposed) return; this.disposed = true; this.suspend(); this.geometry.dispose(); this.material.dispose(); }
}

export default function PrismBeam({ mesh, geometry, model }: { mesh: RefObject<Mesh | null>; geometry: BufferGeometry; model: JourneyModel }) {
  const { scene, size } = useThree();
  const beam = useMemo(() => new WhiteLight(geometry), [geometry]);
  useEffect(() => {
    scene.userData.lsshPrismBeam = beam;
    const hide = (event: PageTransitionEvent) => event.persisted ? beam.suspend() : beam.dispose();
    const swap = () => beam.dispose();
    window.addEventListener('pagehide', hide); document.addEventListener('astro:before-swap', swap);
    return () => { window.removeEventListener('pagehide', hide); document.removeEventListener('astro:before-swap', swap); if (scene.userData.lsshPrismBeam === beam) delete scene.userData.lsshPrismBeam; beam.dispose(); };
  }, [beam, scene]);
  useFrame(({ camera }) => {
    // Runs after GlassRotation (-1), before enhanced (-.5) and Drei (0) snapshots.
    // Dedicated layer also stays excluded in both captures and the normal scene draw.
    camera.layers.disable(PRISM_LIGHT_LAYER);
    const source = mesh.current;
    if (!source) return;
    if (document.hidden) { beam.suspend(); return; }
    const intensity = source.visible && model.motion.raw.wall < (.3 / .35) ? 1 - MathUtils.smoothstep(model.motion.rendered.index, 0, .5) : 0;
    beam.update(source, camera, size.width, size.height, intensity);
  }, -.6);
  return <primitive object={beam.mesh} dispose={null} />;
}
