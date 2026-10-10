import { Camera, Color, ExtrudeGeometry, LinearFilter, Mesh, NoColorSpace, NoToneMapping, Scene, ShaderMaterial, UniformsUtils, Vector3, WebGLRenderer, WebGLRenderTarget } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

// Only the real, visible glass is an emitter; no expanded front/back light meshes.
export default class GlassGlow {
  source: Mesh | null = null;
  intensity = 0;
  mobile = false;
  private readonly scene = new Scene();
  private readonly mask: Mesh;
  private readonly targets = [0, 1, 2, 3].map(i => {
    const target = new WebGLRenderTarget(1, 1, { depthBuffer: i === 3, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter });
    target.texture.colorSpace = NoColorSpace;
    target.texture.name = `lssh-glow-${i}`;
    return target;
  });
  private readonly horizontal = new ShaderMaterial({ ...HorizontalBlurShader, uniforms: UniformsUtils.clone(HorizontalBlurShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false });
  private readonly vertical = new ShaderMaterial({ ...VerticalBlurShader, uniforms: UniformsUtils.clone(VerticalBlurShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false });
  private readonly copy = new ShaderMaterial({ ...CopyShader, uniforms: UniformsUtils.clone(CopyShader.uniforms), depthTest: false, depthWrite: false, toneMapped: false });
  private readonly composite = new ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { glow: { value: this.targets[2].texture }, sourceMask: { value: this.targets[3].texture }, intensity: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader: `uniform sampler2D glow; uniform sampler2D sourceMask; uniform float intensity; varying vec2 vUv;
      void main(){float light=texture2D(glow,vUv).r;float coverage=texture2D(sourceMask,vUv).a;
        float alpha=(1.-exp(-light*.95))*mix(1.,.06,coverage)*intensity;
        gl_FragColor=vec4(vec3(1.),min(alpha,.28));
        #include <colorspace_fragment>
      }` });
  private readonly quad = new FullScreenQuad(this.horizontal);
  private readonly clearColor = new Color();
  private disposed = false;
  private draws = 0;
  private passes = 0;
  private active = false;
  private error: string | null = null;

  constructor(geometry: ExtrudeGeometry, planes: Vector3[][]) {
    const material = new ShaderMaterial({ toneMapped: false,
      uniforms: { outerPlanes: { value: planes[0] }, innerPlanes: { value: planes[1] } },
      vertexShader: `varying vec3 p; varying vec3 n;
        void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 outerPlanes[3];uniform vec3 innerPlanes[3];varying vec3 p;varying vec3 n;
        void main(){float outside=100.,inside=-100.;
          for(int i=0;i<3;i++){outside=min(outside,outerPlanes[i].z-dot(outerPlanes[i].xy,p.xy));inside=max(inside,dot(innerPlanes[i].xy,p.xy)-innerPlanes[i].z);}
          float distance=min(max(outside,0.),max(inside,0.));float edge=exp(-pow(distance/.16,2.));
          float side=1.-abs(normalize(n).z);float direction=.65+.35*max(dot(normalize(n.xy+vec2(.00001)),normalize(vec2(-.85,.25))),0.);
          float emission=(.12+.48*edge+.18*side)*direction;gl_FragColor=vec4(vec3(emission),1.);
        }` });
    this.mask = new Mesh(geometry, material);
    this.mask.matrixAutoUpdate = false;
    this.mask.frustumCulled = false;
    this.scene.add(this.mask);
  }

  render(gl: WebGLRenderer, camera: Camera) {
    this.active = false; this.passes = 0;
    const source = this.source;
    if (this.disposed || this.error || !source?.visible || this.intensity < .0001) return;
    const canvas = gl.domElement;
    const width = Math.max(64, Math.round(canvas.clientWidth / (this.mobile ? 6 : 8)));
    const height = Math.max(64, Math.round(canvas.clientHeight / (this.mobile ? 6 : 8)));
    if (this.targets[0].width !== width || this.targets[0].height !== height) this.targets.slice(0, 3).forEach(target => target.setSize(width, height));
    const coverage = this.targets[3];
    coverage.samples = Math.min(4, gl.capabilities.maxSamples);
    if (coverage.width !== canvas.clientWidth || coverage.height !== canvas.clientHeight) coverage.setSize(canvas.clientWidth, canvas.clientHeight);
    const old = { target: gl.getRenderTarget(), autoClear: gl.autoClear, alpha: gl.getClearAlpha(), tone: gl.toneMapping, xr: gl.xr.enabled, shadow: gl.shadowMap.autoUpdate };
    gl.getClearColor(this.clearColor);
    try {
      source.updateWorldMatrix(true, false);
      this.mask.matrix.copy(source.matrixWorld);
      gl.xr.enabled = false; gl.shadowMap.autoUpdate = false; gl.toneMapping = NoToneMapping;
      gl.autoClear = true; gl.setClearColor(0x000000, 0);
      // Coverage resolves at CSS pixel resolution with MSAA; diffusion stays small.
      gl.setRenderTarget(coverage); gl.render(this.scene, camera); this.passes++;
      this.copy.uniforms.tDiffuse.value = coverage.texture;
      this.quad.material = this.copy; gl.setRenderTarget(this.targets[0]); this.quad.render(gl); this.passes++;
      this.horizontal.uniforms.h.value = 1 / width;
      this.vertical.uniforms.v.value = 1 / height;
      // Dense adjacent samples, twice per axis. Large sparse offsets create copies.
      let input = this.targets[0].texture;
      for (let i = 0; i < 2; i++) {
        this.horizontal.uniforms.tDiffuse.value = input;
        this.quad.material = this.horizontal; gl.setRenderTarget(this.targets[1]); this.quad.render(gl);
        this.vertical.uniforms.tDiffuse.value = this.targets[1].texture;
        this.quad.material = this.vertical; gl.setRenderTarget(this.targets[2]); this.quad.render(gl);
        input = this.targets[2].texture; this.passes += 2;
      }
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
    return { mechanism: 'real-geometry-screen-blur', intensity: this.intensity, active: this.active, draws: this.draws, passes: this.passes, size: [this.targets[0].width, this.targets[0].height], coverageSize: [this.targets[3].width, this.targets[3].height], coverageSamples: this.targets[3].samples, targets: this.targets.map(target => target.texture.uuid), disposed: this.disposed, error: this.error };
  }

  suspend() { this.intensity = 0; this.active = false; this.passes = 0; }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.active = false;
    this.targets.forEach(target => target.dispose());
    (this.mask.material as ShaderMaterial).dispose();
    this.horizontal.dispose(); this.vertical.dispose(); this.copy.dispose(); this.composite.dispose(); this.quad.dispose();
    this.scene.remove(this.mask); this.source = null;
    // The shared source geometry remains owned by GlassTriangle.
  }
}
