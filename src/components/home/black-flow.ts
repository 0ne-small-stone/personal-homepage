import { ClampToEdgeWrapping, FloatType, LinearFilter, MathUtils, Vector2, type ShaderMaterial, type WebGLRenderer, type WebGLRenderTarget } from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { MotionLerper } from './works-motion';

// Independently implemented from SYSTEM 9.2.4; no proprietary shader source.
export const flowPassOrder = ['curl', 'force', 'divergence', 'pressure', 'pressure', 'pressure', 'pressure', 'project', 'advect'];
const neighbors = /* glsl */`
  uniform sampler2D field;
  vec4 at(vec2 p) { return texture2D(field, p / resolution); }
`;
const shaders = {
  curl: `${neighbors}
    void main() {
      vec2 p=gl_FragCoord.xy;
      float c=.02*(at(p+vec2(1.,0.)).y-at(p-vec2(1.,0.)).y-at(p+vec2(0.,1.)).x+at(p-vec2(0.,1.)).x);
      gl_FragColor=vec4(c,0.,0.,0.);
    }`,
  force: `${neighbors}
    uniform sampler2D curls; uniform vec2 pointer; uniform vec2 source; uniform float radius; uniform float aspect;
    float curlAt(vec2 p) { return texture2D(curls,p/resolution).x; }
    void main() {
      vec2 p=gl_FragCoord.xy;
      vec2 f=.5*vec2(abs(curlAt(p+vec2(0.,1.)))-abs(curlAt(p-vec2(0.,1.))),abs(curlAt(p+vec2(1.,0.)))-abs(curlAt(p-vec2(1.,0.))));
      f=f/(length(f)+.0001)*curlAt(p); f.y=-f.y;
      vec2 d=p/resolution-pointer;
      if(aspect<1.) d.x*=aspect; else d.y/=aspect;
      float weight=1.-smoothstep(0.,radius,length(d));
      vec4 v=at(p); gl_FragColor=vec4(v.xy+weight*source+f,v.zw);
    }`,
  divergence: `${neighbors}
    void main() {
      vec2 p=gl_FragCoord.xy; vec4 v=at(p);
      float d=.5*(at(p+vec2(1.,0.)).x-at(p-vec2(1.,0.)).x+at(p+vec2(0.,1.)).y-at(p-vec2(0.,1.)).y);
      gl_FragColor=vec4(v.xyz,d);
    }`,
  pressure: `${neighbors}
    void main() {
      vec2 p=gl_FragCoord.xy; vec4 v=at(p);
      float pressure=(at(p-vec2(1.,0.)).z+at(p+vec2(1.,0.)).z+at(p-vec2(0.,1.)).z+at(p+vec2(0.,1.)).z-v.w)*.25;
      gl_FragColor=vec4(v.xy,pressure,v.w);
    }`,
  project: `${neighbors}
    void main() {
      vec2 p=gl_FragCoord.xy; vec4 v=at(p);
      v.xy-=vec2(at(p+vec2(1.,0.)).z-at(p-vec2(1.,0.)).z,at(p+vec2(0.,1.)).z-at(p-vec2(0.,1.)).z);
      gl_FragColor=v;
    }`,
  advect: `${neighbors}
    void main() { vec2 p=gl_FragCoord.xy; gl_FragColor=vec4(at(p-at(p).xy).xy*.99,0.,0.); }`,
};

export class BlackFlow {
  readonly width: number;
  readonly height: number;
  readonly aspect: number;
  private gpu: GPUComputationRenderer;
  private fields: WebGLRenderTarget[];
  private curls: WebGLRenderTarget;
  private zero;
  private materials: Record<keyof typeof shaders, ShaderMaterial>;
  private index = 0;
  private position = [new MotionLerper(1), new MotionLerper(1)];
  private velocity = [new MotionLerper(2), new MotionLerper(2)];
  private buffer = new Vector2();
  private pointerRevision = -1;
  private initialization = -1;
  private wasRunning = false;
  cycles = 0;
  epoch = 0;
  resets = 0;
  last = { reset: 'create', position: [0, 0], residual: [0, 0], velocity: [0, 0], buffer: [0, 0], source: [0, 0], radius: .01, passes: 0 };

  constructor(private gl: WebGLRenderer, width: number, height: number) {
    this.aspect = width / height;
    this.width = this.aspect >= 1 ? 256 : Math.max(1, Math.round(256 * this.aspect));
    this.height = this.aspect >= 1 ? Math.max(1, Math.round(256 / this.aspect)) : 256;
    this.gpu = new GPUComputationRenderer(this.width, this.height, gl);
    this.gpu.setDataType(FloatType);
    const target = () => this.gpu.createRenderTarget(this.width, this.height, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);
    this.fields = [target(), target()]; this.curls = target(); this.zero = this.gpu.createTexture();
    this.materials = Object.fromEntries(Object.entries(shaders).map(([name, shader]) => {
      const m = this.gpu.createShaderMaterial(shader, { field: { value: null }, curls: { value: this.curls.texture }, pointer: { value: new Vector2() }, source: { value: new Vector2() }, radius: { value: .01 }, aspect: { value: this.aspect } });
      m.toneMapped = false; m.depthTest = false; m.depthWrite = false;
      return [name, m];
    })) as typeof this.materials;
    this.clear();
  }
  get texture() { return this.fields[this.index].texture; }
  clear() {
    this.fields.concat(this.curls).forEach(t => this.gpu.renderTexture(this.zero, t));
    this.buffer.set(0, 0); this.epoch++; this.resets++;
  }
  private align(pointer: { x: number; y: number; revision: number }) {
    this.position[0].reset(pointer.x); this.position[1].reset(pointer.y);
    this.velocity.forEach(v => v.reset(0)); this.buffer.set(0, 0); this.pointerRevision = pointer.revision;
  }
  suspend(pointer: { x: number; y: number; revision: number }) { this.clear(); this.align(pointer); this.wasRunning = false; }
  step(pointer: { x: number; y: number; active: boolean; revision: number }, initialization: number, running: boolean, dt: number) {
    let reset = '';
    if (this.initialization !== initialization) { this.clear(); this.align(pointer); this.initialization = initialization; reset = 'initialization'; }
    if (running !== this.wasRunning) { this.clear(); this.align(pointer); reset = running ? 'resume' : 'suspend'; }
    if (pointer.revision !== this.pointerRevision) { this.align(pointer); reset ||= 'pointer-entry'; }
    this.wasRunning = running;
    const p = [this.position[0].read(pointer.x), this.position[1].read(pointer.y)];
    const residual = [pointer.x - p[0], pointer.y - p[1]];
    const v = [this.velocity[0].read(pointer.active ? residual[0] : 0), this.velocity[1].read(pointer.active ? -residual[1] : 0)];
    if (!running) { this.align(pointer); this.last = { reset, position: p, residual: [0, 0], velocity: [0, 0], buffer: [0, 0], source: [0, 0], radius: .01, passes: 0 }; return; }
    const power = (n: number) => Math.sign(n) * Math.abs(n) ** 1.6;
    // Leave keeps the last NDC but clears the source instead of injecting a jump.
    if (pointer.active) { this.buffer.x = MathUtils.clamp(this.buffer.x + power(v[0]), -1, 1); this.buffer.y = MathUtils.clamp(this.buffer.y - power(v[1]), -1, 1); }
    else this.buffer.set(0, 0);
    const radius = .01 + .1 * Math.min(.5, MathUtils.smoothstep(this.buffer.length(), .01, 1));
    const source = this.buffer.clone().multiplyScalar(30);
    if (this.aspect < 1) source.x /= this.aspect; else source.y *= this.aspect;
    source.clampScalar(-2, 2);
    const force = this.materials.force.uniforms;
    force.pointer.value.set(p[0] * .5 + .5, p[1] * .5 + .5); force.source.value.copy(source); force.radius.value = radius;
    this.materials.curl.uniforms.field.value = this.texture;
    this.gpu.doRenderTarget(this.materials.curl, this.curls);
    for (const name of flowPassOrder.slice(1)) {
      const material = this.materials[name as keyof typeof shaders];
      material.uniforms.field.value = this.texture;
      this.gpu.doRenderTarget(material, this.fields[1 - this.index]); this.index = 1 - this.index;
    }
    this.cycles++;
    this.last = { reset, position: p, residual, velocity: v, buffer: this.buffer.toArray(), source: source.toArray(), radius, passes: 9 };
    this.buffer.multiplyScalar(.5);
    // Independent raw-RAF input Lerpers advance only after the solve.
    this.position.concat(this.velocity).forEach(l => l.update(dt));
  }
  readback() {
    const values = new Float32Array(this.width * this.height * 4);
    this.gl.readRenderTargetPixels(this.fields[this.index], 0, 0, this.width, this.height, values);
    let max = 0, energy = 0, invalid = 0, nonzero = 0, pressureMax = 0;
    for (let i = 0; i < values.length; i += 4) {
      const speed = Math.hypot(values[i], values[i + 1]);
      if (!Number.isFinite(speed)) invalid++; else { max = Math.max(max, speed); energy += speed * speed; if (speed > .001) nonzero++; }
      pressureMax = Math.max(pressureMax, Math.abs(values[i + 2]), Math.abs(values[i + 3]));
    }
    return { max, energy, invalid, nonzero, pressureMax, cells: this.width * this.height };
  }
  dispose() { this.fields.concat(this.curls).forEach(t => t.dispose()); Object.values(this.materials).forEach(m => m.dispose()); this.zero.dispose(); this.gpu.dispose(); }
}
