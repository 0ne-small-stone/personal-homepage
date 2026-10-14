import {
  Camera, Color, HalfFloatType, LinearFilter, Matrix3, NoColorSpace, NoToneMapping, Object3D, Scene, ShaderMaterial,
  Texture, UnsignedByteType, Vector2, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import type { JourneyModel } from './scene-state';
import { portalCoversViewport, portalUvProjection, portalWallY, type PortalQuad } from './wall-portal-geometry';
import { wallBuild, wallView } from './wall-assembly';

const vertexShader = `varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

const fragmentShader = `precision highp float;
  uniform sampler2D wallScene;
  uniform vec2 a; uniform vec2 b; uniform vec2 c; uniform vec2 d;
  uniform vec2 resolution; uniform mat3 wallUvProjection; uniform vec2 wallView;
  uniform sampler2D glassCoverage; uniform float hasGlassCoverage;
  uniform float prepare; uniform float expand; uniform float wall;
  varying vec2 vUv;
  float cross2(vec2 x,vec2 y){return x.x*y.y-x.y*y.x;}
  float edgeDistance(vec2 p,vec2 start,vec2 end,float orientation){
    vec2 edge=(end-start)*resolution;
    return orientation*cross2(edge,(p-start)*resolution)/max(length(edge),.00001);
  }
  void main(){
    float e=smoothstep(0.,1.,expand);
    float orientation=sign(cross2(b-a,c-a));
    float distance=min(min(edgeDistance(vUv,a,b,orientation),edgeDistance(vUv,b,c,orientation)),
      min(edgeDistance(vUv,c,d,orientation),edgeDistance(vUv,d,a,orientation)));
    if(distance < -24.) {gl_FragColor=vec4(0.);return;}
    float coverage=smoothstep(-.75,.75,distance);
    if(hasGlassCoverage>.5 && expand<.999) coverage*=texture2D(glassCoverage,vUv).a;
    // Uniform CSS-pixel scale, anchored to the opening floor, ending at identity.
    vec2 uv=vec2(.5+(vUv.x-.5)/wallView.x,(vUv.y-wallView.y)/wallView.x);
    vec4 sampleColor=texture2D(wallScene,clamp(uv,vec2(.001),vec2(.999)));
    float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
    float surfaceAlpha=coverage*sampleColor.a*inside;
    float handoff=smoothstep(0.,.12,expand);
    float rim=handoff*(.07*exp(-distance*distance/18.)+.025*exp(-distance*distance/128.));
    float rimAlpha=step(.0001,expand)*rim*(1.-surfaceAlpha);
    float finalAlpha=surfaceAlpha+rimAlpha;
    vec3 radiance=(sampleColor.rgb*surfaceAlpha+vec3(.7)*rimAlpha)/max(finalAlpha,.000001);
    gl_FragColor=vec4(radiance,finalAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function matrixChanged(before: number[] | undefined, object: Camera) {
  const values = [...object.matrixWorld.elements, ...object.projectionMatrix.elements];
  return !before || values.some((value, index) => Math.abs(value - before[index]) > 1e-5);
}

/** One cached render target of the real RisingWall meshes, sampled by the projected prism contour. */
export default class WallPortal {
  private readonly target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType, depthBuffer: true, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter,
  });
  private readonly material = new ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: true,
    uniforms: {
      wallScene: { value: this.target.texture }, a: { value: new Vector2() }, b: { value: new Vector2() },
      c: { value: new Vector2() }, d: { value: new Vector2() },
      resolution: { value: new Vector2() }, wallUvProjection: { value: new Matrix3() }, wallView:{value:new Vector2(1,0)},
      glassCoverage: { value: null }, hasGlassCoverage: { value: 0 },
      prepare: { value: 0 }, expand: { value: 0 }, wall: { value: 0 },
    },
    vertexShader, fragmentShader,
  });
  private readonly quad = new FullScreenQuad(this.material);
  private readonly clearColor = new Color();
  private wallGroup: Object3D | null = null;
  private contour: PortalQuad | null = null;
  private homographyValid = false;
  private targetReady = false;
  private targetSize = '';
  private cameraState?: number[];
  private sampleY = Infinity;
  private sampleRevision = -1;
  private formatConfigured = false;
  private disposed = false;
  private error: string | null = null;
  private lastDiagnosticAt = 0;

  constructor(private readonly model: JourneyModel) {
    this.target.texture.colorSpace = NoColorSpace;
    this.target.texture.name = 'lssh-wall-portal';
  }

  renderWall(gl: WebGLRenderer, scene: Scene, camera: Camera) {
    const prepare = this.model.motion.rendered.prepare, expand = this.model.motion.rendered.expand;
    this.material.uniforms.prepare.value = prepare;
    this.material.uniforms.expand.value = expand;
    this.material.uniforms.wall.value = this.model.motion.rendered.wall;
    if (this.disposed || this.model.motion.rendered.wall >= .999 || (prepare <= .001 && expand <= .001)) return;
    this.wallGroup = scene.userData.lsshWallGroup ?? this.wallGroup;
    this.contour = scene.userData.lsshPortalQuad ?? this.contour;
    if (!this.wallGroup || !this.contour || !('layers' in camera)) return;
    if (!this.formatConfigured) {
      this.target.texture.type = gl.extensions.has('EXT_color_buffer_float') ? HalfFloatType : UnsignedByteType;
      this.formatConfigured = true;
    }
    const canvas = gl.domElement;
    this.material.uniforms.resolution.value.set(canvas.clientWidth, canvas.clientHeight);
    const ratio = Math.min(1, 1280 / Math.max(canvas.width, canvas.height));
    const width = Math.max(1, Math.round(canvas.width * ratio));
    const height = Math.max(1, Math.round(canvas.height * ratio));
    const size = `${width}:${height}`;
    if (this.targetSize !== size) {
      this.target.setSize(width, height);
      this.targetSize = size;
      this.targetReady = false;
    }
    camera.updateMatrixWorld(true);
    const wallY = portalWallY(this.model.motion.rendered.wall);
    const revision=scene.userData.lsshWallRevision??0;
    if (!this.targetReady || revision!==this.sampleRevision || Math.abs(wallY - this.sampleY) > .0001 || matrixChanged(this.cameraState, camera)) {
      const old = {
        target: gl.getRenderTarget(), autoClear: gl.autoClear, alpha: gl.getClearAlpha(),
        tone: gl.toneMapping, layers: camera.layers.mask, xr: gl.xr.enabled, shadows: gl.shadowMap.autoUpdate,
        visible: this.wallGroup.visible, position: this.wallGroup.position.y,
      };
      const lightLayers: { layers: { mask: number }; mask: number }[] = [];
      scene.traverse(object => {
        if ((object as Object3D & { isLight?: boolean }).isLight) {
          lightLayers.push({ layers: object.layers, mask: object.layers.mask });
          object.layers.enable(2);
        }
      });
      gl.getClearColor(this.clearColor);
      try {
        this.wallGroup.visible = true;
        this.wallGroup.position.y = wallY;
        this.wallGroup.updateMatrixWorld(true);
        gl.xr.enabled = false;
        gl.shadowMap.autoUpdate = false;
        gl.toneMapping = NoToneMapping;
        gl.autoClear = true;
        gl.setClearColor(0x000000, 0);
        camera.layers.set(2);
        gl.setRenderTarget(this.target);
        gl.clear(true, true, true);
        gl.render(scene, camera);
        this.cameraState = [...camera.matrixWorld.elements, ...camera.projectionMatrix.elements];
        this.targetReady = true;
        this.sampleY = wallY;
        this.sampleRevision=revision;
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'wall-target-render-failed';
        this.targetReady = false;
      } finally {
        this.wallGroup.position.y = old.position;
        this.wallGroup.visible = old.visible;
        this.wallGroup.updateMatrixWorld(true);
        lightLayers.forEach(({ layers, mask }) => { layers.mask = mask; });
        camera.layers.mask = old.layers;
        gl.setRenderTarget(old.target);
        gl.setClearColor(this.clearColor, old.alpha);
        gl.autoClear = old.autoClear;
        gl.toneMapping = old.tone;
        gl.xr.enabled = old.xr;
        gl.shadowMap.autoUpdate = old.shadows;
      }
    }
    if (!this.targetReady) return;
    this.updateContour();
    this.model.motion.portalCovered = portalCoversViewport(this.contour) && scene.userData.lsshPortalFrontCovered === true && !this.error;
    if (document.documentElement.dataset.motionDiagnostics === 'true' && performance.now() - this.lastDiagnosticAt > 40) {
      this.lastDiagnosticAt = performance.now();
      this.model.motion.portal = {
        prepare: this.model.motion.raw.prepare, renderedPrepare: this.model.motion.rendered.prepare,
        expand: this.model.motion.raw.expand, renderedExpand: this.model.motion.rendered.expand,
        wall: this.model.motion.raw.wall, renderedWall: this.model.motion.rendered.wall,
        build:wallBuild(expand,this.model.motion.rendered.wall),sampleRevision:this.sampleRevision,
        target: [this.target.width, this.target.height], targetReady: this.targetReady,
        hdr: this.target.texture.type === HalfFloatType,
        homographyValid: this.homographyValid, quad: this.contour.map(point => point.toArray()),
        frontCoversCorners: scene.userData.lsshPortalFrontCovered === true,
        coversCorners: this.model.motion.portalCovered,
        error: this.error,
      };
    }
  }

  private updateContour() {
    if (!this.contour) return;
    const [a,b,c,d] = this.contour;
    this.material.uniforms.a.value.copy(a); this.material.uniforms.b.value.copy(b);
    this.material.uniforms.c.value.copy(c); this.material.uniforms.d.value.copy(d);
    const projection = portalUvProjection(this.contour);
    this.homographyValid = projection !== null;
    if (projection) this.material.uniforms.wallUvProjection.value.copy(projection);
    const view=wallView(this.model.motion.rendered.expand,Math.min(...this.contour.map(point=>point.y)));
    this.material.uniforms.wallView.value.set(view.scale,view.bottom);
  }

  composite(gl: WebGLRenderer) {
    if (this.disposed || !this.targetReady || this.model.motion.rendered.expand >= .999 ||
      (this.model.motion.rendered.prepare <= .001 && this.model.motion.rendered.expand <= .001)) return;
    const oldTarget = gl.getRenderTarget(), oldAutoClear = gl.autoClear;
    try {
      gl.setRenderTarget(oldTarget);
      gl.autoClear = false;
      this.quad.render(gl);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'wall-portal-composite-failed';
    } finally {
      gl.setRenderTarget(oldTarget);
      gl.autoClear = oldAutoClear;
    }
  }

  setGlassCoverage(texture: Texture | null) {
    this.material.uniforms.glassCoverage.value = texture;
    this.material.uniforms.hasGlassCoverage.value = texture ? 1 : 0;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.target.dispose();
    this.material.dispose();
    this.quad.dispose();
    this.wallGroup = null;
    this.contour = null;
  }
}
