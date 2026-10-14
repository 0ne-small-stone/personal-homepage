import { FramebufferTexture, LinearFilter, NoColorSpace, ShaderMaterial, Vector2, type WebGLRenderer } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import type GlassGlow from './GlassGlow';

/** Copies the display-encoded final canvas, preserving each existing material's color path. */
export default class LoadingReveal {
  private texture: FramebufferTexture | null = null;
  private readonly material=new ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{sceneImage:{value:null},nearEdge:{value:null},farEdge:{value:null},resolution:{value:new Vector2(1,1)},progress:{value:0},bend:{value:.025}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`uniform sampler2D sceneImage;uniform sampler2D nearEdge;uniform sampler2D farEdge;
      uniform vec2 resolution;uniform float progress;uniform float bend;varying vec2 vUv;
      void main(){
        if(progress>=1.){gl_FragColor=texture2D(sceneImage,vUv);return;}
        float q=clamp((progress-.20)/.80,0.,1.);float s=1.-pow(1.-q,3.);
        float shortSide=min(resolution.x,resolution.y);vec2 unit=resolution/shortSide;
        vec2 point=(vUv-.5)*unit;float r=length(point);
        float radius=mix(-.18,length(.5*unit)+.18,s);
        float mask=1.-smoothstep(radius-.09,radius+.09,r);
        float ring=exp(-pow((r-radius)/.18,2.));
        vec2 offset=point/max(r,.00001)*bend*sin(3.14159265*s)*ring/unit;
        vec2 uv=.5+(vUv-.5)*mix(.92,1.,s)+offset;
        vec3 image=texture2D(sceneImage,clamp(uv,vec2(0.),vec2(1.))).rgb;
        float light=.45*texture2D(nearEdge,vUv).r+.55*texture2D(farEdge,vUv).r;
        vec3 outline=vec3(.32*(1.-exp(-light*3.)));
        gl_FragColor=vec4(mix(outline,image,mask),1.);
      }`});
  private readonly quad=new FullScreenQuad(this.material);
  private disposed=false;
  private copies=0;
  render(gl:WebGLRenderer,glow:GlassGlow|undefined,progress:number) {
    if(this.disposed)return;
    const width=gl.domElement.width,height=gl.domElement.height;
    if(!this.texture||this.texture.image.width!==width||this.texture.image.height!==height) {
      this.texture?.dispose();this.texture=new FramebufferTexture(width,height);
      this.texture.colorSpace=NoColorSpace;this.texture.minFilter=this.texture.magFilter=LinearFilter;
      this.texture.name='lssh-loading-final-canvas';
    }
    gl.copyFramebufferToTexture(this.texture);
    this.material.uniforms.sceneImage.value=this.texture;
    this.material.uniforms.nearEdge.value=glow?.nearTexture??this.texture;
    this.material.uniforms.farEdge.value=glow?.farTexture??this.texture;
    this.material.uniforms.resolution.value.set(width,height);
    this.material.uniforms.progress.value=progress;
    this.material.uniforms.bend.value=gl.domElement.clientWidth<=767?.015:.025;
    gl.autoClear=false;this.quad.render(gl);this.copies++;
  }
  diagnostics() { return {active:!this.disposed&&Boolean(this.texture),copies:this.copies,size:this.texture?[this.texture.image.width,this.texture.image.height]:[],disposed:this.disposed}; }
  dispose() { if(this.disposed)return;this.disposed=true;this.texture?.dispose();this.texture=null;this.material.dispose();this.quad.dispose(); }
}
