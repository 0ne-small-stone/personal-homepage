import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, MathUtils, Matrix4, Mesh, ShaderMaterial, Vector2, Vector3, type Camera } from 'three';
import type { JourneyModel } from './scene-state';
import { MAX_INTERFACES, PRISM_INCIDENT_SLOPE, PRISM_LIGHT_LAYER, PrismRaySolver } from './prism-ray';
import { PRISM_WAVELENGTHS, prismIOR, sameInterfaceTopology } from './prism-spectrum';

class SpectrumLight {
  readonly solvers: PrismRaySolver[];
  // Display colours are an sRGB spectral approximation, not radiometric data.
  private readonly colours = ['#fa392d', '#ff922e', '#ffe34a', '#59d17c', '#39c4e0', '#4b81f5', '#ac62ed'].map(c => new Color(c));
  private readonly white = new Color(1, 1, 1);
  private readonly pairs = new Array<boolean>(6).fill(false);
  private readonly paired = new Array<boolean>(7).fill(false);
  readonly geometry = new BufferGeometry();
  readonly material = new ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: DoubleSide,
    uniforms: { resolution: { value: new Vector2() }, intensity: { value: 0 }, halfWidth: { value: 4 } },
    vertexShader: `attribute vec3 start;attribute vec3 end;attribute vec3 startHigh;attribute vec3 endHigh;
      attribute vec2 corner;attribute vec2 spectralRange;attribute vec3 colourLow;attribute vec3 colourHigh;
      attribute float strength;attribute float whiteLine;
      uniform vec2 resolution;uniform float halfWidth;varying float lateral;varying float energy;varying float mono;varying vec3 lightColour;
      void main(){vec4 a=projectionMatrix*viewMatrix*vec4(start,1.);vec4 b=projectionMatrix*viewMatrix*vec4(end,1.);
        vec4 c=projectionMatrix*viewMatrix*vec4(startHigh,1.);vec4 d=projectionMatrix*viewMatrix*vec4(endHigh,1.);
        vec2 delta=((b.xy/b.w+d.xy/d.w)-(a.xy/a.w+c.xy/c.w))*resolution;
        vec2 tangent=delta/max(length(delta),.00001);
        vec4 low=mix(a,b,corner.x);vec4 high=mix(c,d,corner.x);
        vec4 clip=mix(low,high,corner.y);float fraction=mix(spectralRange.x,spectralRange.y,corner.y);
        vec2 perpendicular=vec2(-tangent.y,tangent.x);
        vec2 separation=((c.xy/c.w-a.xy/a.w)+(d.xy/d.w-b.xy/b.w))*resolution;
        float orientation=whiteLine>.5?1.:(dot(separation,perpendicular)<0.?-1.:1.);
        lateral=fraction*2.-1.;clip.xy+=perpendicular*orientation*lateral*halfWidth*2./resolution*clip.w;
        energy=strength;mono=whiteLine;lightColour=mix(colourLow,colourHigh,corner.y);gl_Position=clip;}`,
    fragmentShader: `uniform float intensity;varying float lateral;varying float energy;varying float mono;varying vec3 lightColour;
      void main(){float fraction=lateral*.5+.5;
        float softEdge=smoothstep(0.,.12,fraction)*smoothstep(0.,.12,1.-fraction);
        float profile=mix(softEdge,exp(-6.5*lateral*lateral),mono);
        float alpha=profile*energy*intensity;gl_FragColor=vec4(lightColour,alpha);
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
  // One incident + at most six joined bands and seven isolated paths.
  private readonly capacity = (1 + 13 * MAX_INTERFACES) * 6;
  private readonly starts = new Float32Array(this.capacity * 3);
  private readonly ends = new Float32Array(this.starts.length);
  private readonly startsHigh = new Float32Array(this.starts.length);
  private readonly endsHigh = new Float32Array(this.starts.length);
  private readonly corners = new Float32Array(this.capacity * 2);
  private readonly ranges = new Float32Array(this.corners.length);
  private readonly lows = new Float32Array(this.starts.length);
  private readonly highs = new Float32Array(this.starts.length);
  private readonly energy = new Float32Array(this.capacity);
  private readonly mono = new Float32Array(this.capacity);
  private readonly a = new Vector3();
  private readonly b = new Vector3();
  private readonly c = new Vector3();
  private readonly d = new Vector3();
  private readonly forward = new Vector3();
  private readonly cameraPosition = new Vector3();
  private readonly delta = new Vector3();
  private readonly attributeStart = new BufferAttribute(this.starts, 3).setUsage(DynamicDrawUsage);
  private readonly attributeEnd = new BufferAttribute(this.ends, 3).setUsage(DynamicDrawUsage);
  private segments = 0;
  private bands = 0;
  private singles = 0;

  constructor(geometry: BufferGeometry) {
    const shared = new PrismRaySolver(geometry);
    this.solvers = PRISM_WAVELENGTHS.map((_, i) => i === 0 ? shared : new PrismRaySolver(geometry, shared));
    const corners = [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
    for (let i = 0; i < this.capacity / 6; i++) this.corners.set(corners, i * 12);
    this.geometry.setAttribute('position', new BufferAttribute(new Float32Array(this.starts.length), 3));
    this.geometry.setAttribute('start', this.attributeStart); this.geometry.setAttribute('end', this.attributeEnd);
    this.geometry.setAttribute('corner', new BufferAttribute(this.corners, 2));
    this.geometry.setAttribute('startHigh', new BufferAttribute(this.startsHigh, 3).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('endHigh', new BufferAttribute(this.endsHigh, 3).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('spectralRange', new BufferAttribute(this.ranges, 2).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('colourLow', new BufferAttribute(this.lows, 3).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('colourHigh', new BufferAttribute(this.highs, 3).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('whiteLine', new BufferAttribute(this.mono, 1).setUsage(DynamicDrawUsage));
    this.geometry.setAttribute('strength', new BufferAttribute(this.energy, 1).setUsage(DynamicDrawUsage));
    this.mesh.layers.set(PRISM_LIGHT_LAYER); this.mesh.frustumCulled = false;
    this.mesh.name = 'lssh-prism-spectrum'; this.mesh.userData.lsshPrismLight = true;
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
      const start = performance.now();
      for (let i = 0; i < this.solvers.length; i++) this.solvers[i].trace(source.matrixWorld, this.origin, this.direction, prismIOR(PRISM_WAVELENGTHS[i]));
      this.paired.fill(false);
      for (let i = 0; i < this.pairs.length; i++) {
        this.pairs[i] = sameInterfaceTopology(this.solvers[i], this.solvers[i + 1]);
        if (this.pairs[i]) this.paired[i] = this.paired[i + 1] = true;
      }
      this.lastCpuMs = performance.now() - start; this.totalCpuMs += this.lastCpuMs; this.maxCpuMs = Math.max(this.maxCpuMs, this.lastCpuMs); this.solves++;
      this.previous.copy(source.matrixWorld);
    }
    // Only display length is clipped at the camera near plane; physics remains world-space.
    camera.getWorldDirection(this.forward); camera.getWorldPosition(this.cameraPosition);
    const near = 'near' in camera ? Number(camera.near) + .001 : .101;
    this.segments = this.bands = this.singles = 0;
    const first = this.solvers[0];
    if (first.count > 1) this.append(first.points[0], first.points[1], first.points[0], first.points[1], this.white, this.white, 0, 1, .85, true, near);
    for (let i = 0; i < this.pairs.length; i++) {
      if (!this.pairs[i]) continue;
      const low = this.solvers[i], high = this.solvers[i + 1];
      for (let segment = 1; segment < low.count - 1; segment++) {
        const outside = segment === low.count - 2;
        if (this.append(low.points[segment], low.points[segment + 1], high.points[segment], high.points[segment + 1], this.colours[i], this.colours[i + 1], i / 6, (i + 1) / 6, outside ? .58 : .48, false, near)) this.bands++;
      }
    }
    // No ribbon across unrelated exits. Isolated/TIR paths keep their own soft
    // monochromatic segments with 1/7 energy, including valid internal bounces.
    for (let i = 0; i < this.solvers.length; i++) {
      const ray = this.solvers[i];
      if (this.paired[i] || ray.status === 'miss') continue;
      for (let segment = 1; segment < ray.count - 1; segment++) {
        const outside = ray.status === 'exited' && segment === ray.count - 2;
        if (this.append(ray.points[segment], ray.points[segment + 1], ray.points[segment], ray.points[segment + 1], this.colours[i], this.colours[i], 0, 1, (outside ? .78 : .65) / 7, true, near)) this.singles++;
      }
    }
    for (const name of ['start', 'end', 'startHigh', 'endHigh', 'spectralRange', 'colourLow', 'colourHigh', 'strength', 'whiteLine']) this.geometry.getAttribute(name).needsUpdate = true;
    this.geometry.setDrawRange(0, this.segments * 6);
  }

  private clip(a: Vector3, b: Vector3, near: number) {
    const da = this.delta.copy(a).sub(this.cameraPosition).dot(this.forward) - near;
    const db = this.delta.copy(b).sub(this.cameraPosition).dot(this.forward) - near;
    if (da <= 0 && db <= 0) return false;
    if (da <= 0) a.lerp(b, da / (da - db));
    else if (db <= 0) b.lerp(a, db / (db - da));
    return true;
  }

  private append(a: Vector3, b: Vector3, c: Vector3, d: Vector3, low: Color, high: Color, from: number, to: number, energy: number, mono: boolean, near: number) {
    this.a.copy(a); this.b.copy(b); this.c.copy(c); this.d.copy(d);
    if (!this.clip(this.a, this.b, near) || !this.clip(this.c, this.d, near)) return false;
    const segment = this.segments++;
    for (let vertex = 0; vertex < 6; vertex++) {
      const index = segment * 6 + vertex, offset = index * 3;
      this.a.toArray(this.starts, offset); this.b.toArray(this.ends, offset); this.c.toArray(this.startsHigh, offset); this.d.toArray(this.endsHigh, offset);
      low.toArray(this.lows, offset); high.toArray(this.highs, offset);
      this.ranges[index * 2] = from; this.ranges[index * 2 + 1] = to;
      this.energy[index] = energy; this.mono[index] = mono ? 1 : 0;
    }
    return true;
  }

  diagnostics() {
    return { ...this.solvers[3].diagnostics(), channels: this.solvers.map((ray, i) => ({ nm: PRISM_WAVELENGTHS[i], ior: prismIOR(PRISM_WAVELENGTHS[i]), ...ray.diagnostics() })), pairs: [...this.pairs], bands: this.bands, singles: this.singles, bufferBytes: Object.values(this.geometry.attributes).reduce((sum, a) => sum + a.array.byteLength, 0), incident: { origin: this.origin.toArray(), direction: this.direction.toArray() }, active: this.active, intensity: this.material.uniforms.intensity.value, segments: this.segments, vertices: this.geometry.drawRange.count, layer: this.mesh.layers.mask, depthTest: this.material.depthTest, disposed: this.disposed, solves: this.solves, cpuMs: { last: this.lastCpuMs, mean: this.solves ? this.totalCpuMs / this.solves : 0, max: this.maxCpuMs }, geometry: this.geometry.uuid, material: this.material.uuid };
  }
  suspend() { this.active = false; this.mesh.visible = false; this.material.uniforms.intensity.value = 0; }
  dispose() { if (this.disposed) return; this.disposed = true; this.suspend(); this.geometry.dispose(); this.material.dispose(); }
}

export default function PrismBeam({ mesh, geometry, model }: { mesh: RefObject<Mesh | null>; geometry: BufferGeometry; model: JourneyModel }) {
  const { scene, size } = useThree();
  const beam = useMemo(() => new SpectrumLight(geometry), [geometry]);
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
