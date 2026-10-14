import { Camera, Color, ExtrudeGeometry, Float32BufferAttribute, LinearFilter, Mesh, NoColorSpace, NoToneMapping, Scene, ShaderMaterial, UniformsUtils, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

// Only the real, visible glass is an emitter; no expanded front/back light meshes.
export default class GlassGlow {
  source: Mesh | null = null;
  intensity = 0;
  mobile = false;
  coverageRequested = false;
  coverageReady = false;
  get coverageTexture() { return this.targets[3].texture; }
  private readonly scene = new Scene();
  private readonly mask: Mesh;
  private readonly targets = [0, 1, 2, 3, 4].map(i => {
    const target = new WebGLRenderTarget(1, 1, { depthBuffer: i === 3, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
    target.texture.colorSpace = NoColorSpace;
    target.texture.name = `lssh-glow-${i}`;
    return target;
  });
  private readonly horizontal = new ShaderMaterial({ ...HorizontalBlurShader, uniforms: UniformsUtils.clone(HorizontalBlurShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false });
  private readonly vertical = new ShaderMaterial({ ...VerticalBlurShader, uniforms: UniformsUtils.clone(VerticalBlurShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false });
  private readonly composite = new ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { glow: { value: this.targets[2].texture }, nearGlow: { value: this.targets[4].texture }, intensity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D glow; uniform sampler2D nearGlow; uniform float intensity; varying vec2 vUv;
      void main(){float light=.45*texture2D(nearGlow,vUv).r+.55*texture2D(glow,vUv).r;
        // One continuous field crosses the glass boundary; no sharp coverage cut.
        float alpha=.32*(1.-exp(-light*3.))*intensity;
        gl_FragColor=vec4(vec3(1.),alpha);
        #include <colorspace_fragment>
      }` });
  private readonly quad = new FullScreenQuad(this.horizontal);
  private readonly clearColor = new Color();
  private disposed = false;
  private draws = 0;
  private passes = 0;
  private active = false;
  private error: string | null = null;

  constructor(geometry: ExtrudeGeometry, planes: Vector3[]) {
    const normals = geometry.getAttribute('normal');
    const front = new Float32Array(normals.count);
    for (let i = 0; i < front.length; i++) front[i] = Math.abs(normals.getZ(i)) > .999 ? 1 : 0;
    geometry.setAttribute('portalFrontCoverage', new Float32BufferAttribute(front, 1));
    const material = new ShaderMaterial({ toneMapped: false,
      uniforms: { outerPlanes: { value: planes }, halfDepth: { value: geometry.boundingBox!.max.z }, coverageOnly: { value: 0 } },
      vertexShader: `attribute float portalFrontCoverage;varying float front;varying vec3 p; varying vec3 n;
        void main(){front=portalFrontCoverage;p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 outerPlanes[3];uniform float halfDepth;uniform float coverageOnly;varying float front;varying vec3 p;varying vec3 n;
        void main(){if(coverageOnly>.5){gl_FragColor=vec4(vec3(0.),front);return;}float outside=100.;float second=100.;
          for(int i=0;i<3;i++){
            float d=max(outerPlanes[i].z-dot(outerPlanes[i].xy,p.xy),0.);
            if(d<outside){second=outside;outside=d;}else{second=min(second,d);}
          }
          // Front/back perimeter plus longitudinal corner edges, never a whole face.
          float distance=min(length(vec2(outside,max(halfDepth-abs(p.z),0.))),length(vec2(outside,second)));
          float edge=exp(-pow(distance/.06,2.));
          float direction=.85+.15*max(dot(normalize(n.xy+vec2(.00001)),normalize(vec2(-.85,.25))),0.);
          float emission=.72*edge*direction;gl_FragColor=vec4(vec3(emission),front);
        }` });
    this.mask = new Mesh(geometry, material);
    this.mask.matrixAutoUpdate = false;
    this.mask.frustumCulled = false;
    this.scene.add(this.mask);
  }

  render(gl: WebGLRenderer, camera: Camera) {
    this.active = false; this.passes = 0;
    const source = this.source;
    if (this.disposed || this.error || !source?.visible || (this.intensity < .0001 && !this.coverageRequested)) return;
    const canvas = gl.domElement;
    // The mobile camera projects a much smaller prism; match diffusion to that
    // scale instead of dissolving its edges across desktop-sized CSS radii.
    const width = Math.max(32, Math.round(canvas.clientWidth / (this.mobile ? 3 : 12)));
    const height = Math.max(32, Math.round(canvas.clientHeight / (this.mobile ? 3 : 12)));
    const nearWidth = Math.max(32, Math.round(canvas.clientWidth / (this.mobile ? 1 : 4)));
    const nearHeight = Math.max(32, Math.round(canvas.clientHeight / (this.mobile ? 1 : 4)));
    this.targets.forEach((target, i) => {
      if (i === 3) return;
      const w = i === 1 || i === 4 ? nearWidth : width;
      const h = i === 1 || i === 4 ? nearHeight : height;
      if (target.width !== w || target.height !== h) target.setSize(w, h);
    });
    const coverage = this.targets[3];
    coverage.samples = Math.min(4, gl.capabilities.maxSamples);
    if (coverage.width !== canvas.clientWidth || coverage.height !== canvas.clientHeight) coverage.setSize(canvas.clientWidth, canvas.clientHeight);
    const old = { target: gl.getRenderTarget(), autoClear: gl.autoClear, alpha: gl.getClearAlpha(), tone: gl.toneMapping, xr: gl.xr.enabled, shadow: gl.shadowMap.autoUpdate };
    gl.getClearColor(this.clearColor);
    try {
      source.updateWorldMatrix(true, false);
      this.mask.matrix.copy(source.matrixWorld);
      (this.mask.material as ShaderMaterial).uniforms.coverageOnly.value = this.intensity < .0001 ? 1 : 0;
      gl.xr.enabled = false; gl.shadowMap.autoUpdate = false; gl.toneMapping = NoToneMapping;
      gl.autoClear = true; gl.setClearColor(0x000000, 0);
      // Coverage resolves at CSS pixel resolution with MSAA; diffusion stays small.
      gl.setRenderTarget(coverage); gl.render(this.scene, camera); this.passes++;
      this.coverageReady = true;
      if (this.intensity < .0001) return;
      // Each Gaussian uses adjacent texels at its own scale. The near field
      // prefilters the far field, so broad diffusion does not stamp sharp copies.
      this.horizontal.uniforms.h.value = 1 / nearWidth;
      this.horizontal.uniforms.tDiffuse.value = coverage.texture;
      this.quad.material = this.horizontal; gl.setRenderTarget(this.targets[1]); this.quad.render(gl);
      this.vertical.uniforms.v.value = 1 / nearHeight;
      this.vertical.uniforms.tDiffuse.value = this.targets[1].texture;
      this.quad.material = this.vertical; gl.setRenderTarget(this.targets[4]); this.quad.render(gl);
      this.horizontal.uniforms.h.value = 1 / width;
      this.horizontal.uniforms.tDiffuse.value = this.targets[4].texture;
      this.quad.material = this.horizontal; gl.setRenderTarget(this.targets[0]); this.quad.render(gl);
      this.vertical.uniforms.v.value = 1 / height;
      this.vertical.uniforms.tDiffuse.value = this.targets[0].texture;
      this.quad.material = this.vertical; gl.setRenderTarget(this.targets[2]); this.quad.render(gl); this.passes += 4;
      gl.setRenderTarget(old.target); gl.autoClear = false;
      this.composite.uniforms.intensity.value = this.intensity;
      this.quad.material = this.composite; this.quad.render(gl); this.passes++;
      this.draws++; this.active = true;
    } catch (error) {
      // Preserve the readable glass if optional diffusion cannot be rendered.
      this.error = error instanceof Error ? error.message : 'glow-render-failed';
    } finally {
      gl.setRenderTarget(old.target); gl.setClearColor(this.clearColor, old.alpha);
      gl.autoClear = old.autoClear; gl.toneMapping = old.tone; gl.xr.enabled = old.xr; gl.shadowMap.autoUpdate = old.shadow;
    }
  }

  diagnostics() {
    return { mechanism: 'narrow-3d-edges-multiscale-gaussian', intensity: this.intensity, active: this.active, draws: this.draws, passes: this.passes, size: [this.targets[0].width, this.targets[0].height], nearSize: [this.targets[4].width, this.targets[4].height], coverageSize: [this.targets[3].width, this.targets[3].height], coverageSamples: this.targets[3].samples, targets: this.targets.map(target => target.texture.uuid), disposed: this.disposed, error: this.error };
  }

  suspend() { this.intensity = 0; this.active = false; this.passes = 0; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.active = false;
    this.targets.forEach(target => target.dispose());
    (this.mask.material as ShaderMaterial).dispose();
    this.horizontal.dispose(); this.vertical.dispose(); this.composite.dispose(); this.quad.dispose();
    this.scene.remove(this.mask); this.source = null;
    // The shared source geometry remains owned by GlassTriangle.
  }
}
