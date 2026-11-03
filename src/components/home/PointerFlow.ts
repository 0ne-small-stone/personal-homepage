import {FramebufferTexture,LinearFilter,NoColorSpace,ShaderMaterial,Vector2,Vector3,Vector4,type WebGLRenderer,type Mesh,type Camera} from 'three';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {BlackFlow} from './black-flow';
import {FlowActivity} from './flow-activity.mjs';
import type {JourneyModel} from './scene-state';

type Owned={field:BlackFlow;color:FramebufferTexture;material:ShaderMaterial;quad:FullScreenQuad;dirty:boolean};
export default class PointerFlow {
  private owned:Owned|null=null;
  private activity=new FlowActivity();
  private failed=false;
  private support:boolean|null=null;
  private disposed=false;
  private reason='idle';
  private state={active:false,amount:0,inject:false,clear:false,branch:'black',reason:'initial'};
  private viewport=[0,0,0,0];
  private cycles=0;private copies=0;private resets=0;private passes=0;private clearPasses=0;
  private sampled=false;
  private probeCycles=0;private probeBranch='';
  private probe:(ReturnType<BlackFlow['readback']>&{branch:string;texture:string;at:number})|null=null;
  private inputTrace:{at:number;x:number;y:number;buttons:number;pointerType:string}[]=[];
  private lastStamp=-Infinity;
  private alignedPointer:JourneyModel['pointer']|null=null;
  private solveStamp=-Infinity;
  private solveTrace:{at:number;inputAt:number;dt:number;position:number[];source:number[];amount:number}[]=[];
  private frameTrace:{at:number;dt:number;cycles:number}[]=[];
  private glassBounds=new Vector4();
  private projected=new Vector3();
  private tailStamp=-Infinity;
  private tailSamples:{age:number;amount:number;cycles:number;active:boolean;passes:number}[]=[];
  private identityProbe:{before:number[][];after:number[][];same:boolean}|null=null;
  private readonly fixture:string;
  private readonly debug:boolean;
  constructor(private model:JourneyModel) {
    this.debug=new URLSearchParams(location.search).has('opticsDebug');
    const value=['127.0.0.1','localhost'].includes(location.hostname)?new URLSearchParams(location.search).get('flowPreview')||'':'';
    this.fixture=['off','zero','low','fail'].includes(value)?value:'';
  }
  private preserve<T>(gl:WebGLRenderer,work:()=>T) {
    const target=gl.getRenderTarget(),clear=gl.autoClear,xr=gl.xr.enabled,shadow=gl.shadowMap.autoUpdate;
    try {gl.autoClear=true;gl.xr.enabled=false;gl.shadowMap.autoUpdate=false;return work();}
    finally{gl.setRenderTarget(target);gl.autoClear=clear;gl.xr.enabled=xr;gl.shadowMap.autoUpdate=shadow;}
  }
  private release() {
    const owned=this.owned;this.owned=null;
    if(!owned)return;
    owned.field.dispose();owned.color.dispose();owned.material.dispose();owned.quad.dispose();
  }
  private zero(gl:WebGLRenderer) {
    if(this.owned?.dirty){this.preserve(gl,()=>this.owned!.field.suspend(this.model.pointer));this.owned.dirty=false;this.resets++;this.clearPasses+=3;this.passes+=3;}
    this.model.flowActive=false;
  }
  interrupt(gl:WebGLRenderer,reason:string) {
    if(this.disposed)return;
    this.activity.reset(this.model.pointer,this.model.motion.initialization.revision,this.state.branch,reason);
    this.activity.enabled=false;this.state={active:false,amount:0,inject:false,clear:false,branch:this.state.branch,reason};this.reason=reason;
    try{this.zero(gl);}catch{this.failed=true;this.release();}
    this.publish();
  }
  private create(gl:WebGLRenderer,width:number,height:number) {
    const size=gl.getDrawingBufferSize(new Vector2());
    if(this.owned&&this.viewport[0]===width&&this.viewport[1]===height&&this.viewport[2]===size.x&&this.viewport[3]===size.y)return;
    this.release();this.viewport=[width,height,size.x,size.y];
    this.sampled=false;this.probeCycles=0;this.probe=null;this.probeBranch=this.state.branch;
    let field:BlackFlow|null=null,color:FramebufferTexture|null=null,material:ShaderMaterial|null=null;
    try{
      field=this.preserve(gl,()=>new BlackFlow(gl,width,height));
      field.initializeInput(this.alignedPointer??this.model.pointer,this.model.motion.initialization.revision);
      color=new FramebufferTexture(size.x,size.y);color.colorSpace=NoColorSpace;color.minFilter=color.magFilter=LinearFilter;color.name='lssh-pointer-flow-display';
      material=new ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,
        uniforms:{image:{value:color},field:{value:field.texture},amount:{value:0},coefficient:{value:.01},limit:{value:.012},resolution:{value:size},fieldSize:{value:new Vector2(field.width,field.height)},glassBounds:{value:this.glassBounds},protectGlass:{value:0}},
        vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',
        fragmentShader:`uniform sampler2D image;uniform sampler2D field;uniform float amount;uniform float coefficient;uniform float limit;uniform vec2 resolution;uniform vec2 fieldSize;uniform vec4 glassBounds;uniform float protectGlass;varying vec2 vUv;
          // C2 cubic B-spline on displacement only, using four bilinear fetches.
          // The full-resolution scene snapshot is still sampled exactly once.
          vec2 smoothField(vec2 uv){
            vec2 p=uv*fieldSize-.5,base=floor(p),f=fract(p),a=1.-f;
            vec2 w0=a*a*a/6.,w1=(3.*f*f*f-6.*f*f+4.)/6.;
            vec2 w2=(-3.*f*f*f+3.*f*f+3.*f+1.)/6.,w3=f*f*f/6.;
            vec2 g0=w0+w1,g1=w2+w3;
            vec2 h0=(base-.5+w1/g0)/fieldSize,h1=(base+1.5+w3/g1)/fieldSize;
            return g0.y*(g0.x*texture2D(field,h0).xy+g1.x*texture2D(field,vec2(h1.x,h0.y)).xy)
              +g1.y*(g0.x*texture2D(field,vec2(h0.x,h1.y)).xy+g1.x*texture2D(field,h1).xy);
          }
          void main(){vec2 unit=resolution/min(resolution.x,resolution.y);vec2 shift=smoothField(vUv)*coefficient;
            // Continuous strain attenuation suppresses local sharp folds without
            // blurring the glass/brick image or lowering the global coefficient.
            vec2 gx=dFdx(shift)*resolution.x,gy=dFdy(shift)*resolution.y;
            float strain=sqrt(dot(gx,gx)+dot(gy,gy));
            shift/=sqrt(1.+pow(strain/.35,2.));
            vec2 delta=shift*unit;
            delta*=limit/sqrt(limit*limit+dot(delta,delta));
            // Glass is a rigid object in the space, not a fluid membrane.
            // A padded, soft exterior guard leaves its snapshot silhouette exact.
            vec2 outside=max(max(glassBounds.xy-vUv,vUv-glassBounds.zw),vec2(0.))*unit;
            float guard=mix(1.,smoothstep(.018,.065,length(outside)),protectGlass);
            vec2 uv=clamp(vUv+delta*amount*guard/unit,.5/resolution,1.-.5/resolution);
            // Snapshot is already display encoded. No second color conversion.
            gl_FragColor=texture2D(image,uv);}`});
      this.owned={field,color,material,quad:new FullScreenQuad(material),dirty:false};
    }catch(error){field?.dispose();color?.dispose();material?.dispose();throw error;}
  }
  render(gl:WebGLRenderer,enabled:boolean,width:number,height:number,glass?:Mesh,camera?:Camera) {
    if(this.disposed)return;
    this.passes=0;this.clearPasses=0;
    const pointer=this.model.pointer,now=this.model.lastFrame;
    const m=this.model.motion;
    const branch=m.rendered.expand>=.999&&m.rendered.wall>=.999?'wall':m.raw.prepare>0||m.rendered.prepare>.001?'transition':'black';
    const supported=this.support??(this.support=gl.capabilities.isWebGL2&&gl.capabilities.maxTextureSize>=2048&&Boolean(gl.getContext().getExtension('EXT_color_buffer_float'))&&Boolean(gl.getContext().getExtension('OES_texture_float_linear')));
    const allowed=enabled&&supported&&!this.failed&&!['off','low','fail'].includes(this.fixture);
    this.state=this.activity.update(now,pointer,m.initialization.revision,allowed,branch);
    this.model.flowActive=this.state.active;
    if(this.debug&&pointer.movedAt!==this.lastStamp){this.lastStamp=pointer.movedAt;this.inputTrace.push({at:pointer.movedAt,x:pointer.x,y:pointer.y,buttons:pointer.buttons,pointerType:pointer.pointerType});this.inputTrace=this.inputTrace.slice(-64);}
    this.reason=!enabled?'gated':!supported?'float-or-quality-unavailable':this.fixture==='low'?'fixture-low-quality':this.fixture==='fail'?'fixture-unavailable':this.fixture==='off'?'fixture-off':this.failed?'optional-flow-failed':this.state.reason;
    try{
      if(!this.state.active){this.zero(gl);this.alignedPointer={...pointer};this.publish();return;}
      const resized=this.owned&&(this.viewport[0]!==width||this.viewport[1]!==height||this.viewport[2]!==gl.domElement.width||this.viewport[3]!==gl.domElement.height);
      if(resized){this.interrupt(gl,'resize-aligned');this.release();this.publish();return;}
      const creating=!this.owned;
      this.create(gl,width,height);const owned=this.owned!;
      const protect=this.state.branch==='black'&&Boolean(glass?.visible&&camera);
      if(protect){
        const geometry=glass!.geometry;geometry.boundingBox??geometry.computeBoundingBox();const box=geometry.boundingBox!;
        let left=Infinity,bottom=Infinity,right=-Infinity,top=-Infinity;
        for(let i=0;i<8;i++){
          this.projected.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(glass!.matrixWorld).project(camera!);
          const x=this.projected.x*.5+.5,y=this.projected.y*.5+.5;
          left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);
        }
        this.glassBounds.set(left,bottom,right,top);
      }
      owned.material.uniforms.protectGlass.value=protect?1:0;
      if(creating){this.clearPasses+=3;this.resets++;this.passes+=3;}
      if(this.state.clear)this.zero(gl);
      const resetsBefore=owned.field.resets;
      this.preserve(gl,()=>owned.field.step(pointer,m.initialization.revision,true,this.model.frameDelta,this.state.inject));
      const resetCount=owned.field.resets-resetsBefore;this.resets+=resetCount;this.clearPasses+=3*resetCount;this.passes+=3*resetCount;
      owned.dirty=true;this.cycles++;this.passes+=9;
      if(this.debug){
        this.frameTrace.push({at:now,dt:this.model.frameDelta,cycles:this.cycles});this.frameTrace=this.frameTrace.slice(-64);
        if(pointer.movedAt!==this.solveStamp){
          this.solveStamp=pointer.movedAt;this.solveTrace.push({at:now,inputAt:pointer.movedAt,dt:this.model.frameDelta,position:owned.field.last.position,source:owned.field.last.source,amount:this.state.amount});this.solveTrace=this.solveTrace.slice(-64);
        }
        if(this.probeBranch!==this.state.branch){this.probeBranch=this.state.branch;this.sampled=false;this.probeCycles=0;this.probe=null;}
        this.probeCycles++;
        if(!this.sampled&&this.probeCycles>=12){this.probe={...this.preserve(gl,()=>owned.field.readback()),branch:this.state.branch,texture:owned.field.texture.uuid,at:this.model.lastFrame};this.sampled=true;}
      }
      const identity=this.debug&&this.fixture==='zero'&&!this.identityProbe?this.pixels(gl):null;
      gl.copyFramebufferToTexture(owned.color);
      owned.material.uniforms.field.value=owned.field.texture;
      owned.material.uniforms.amount.value=this.fixture==='zero'?0:this.state.amount;
      owned.material.uniforms.coefficient.value=this.state.branch==='wall'?-.006:.01;
      owned.material.uniforms.limit.value=this.state.branch==='wall'?.008:.012;
      gl.autoClear=false;owned.quad.render(gl);this.copies++;this.passes++;
      if(identity){const after=this.pixels(gl);this.identityProbe={before:identity,after,same:JSON.stringify(identity)===JSON.stringify(after)};}
    }catch(error){this.reason=error instanceof Error?error.message:'optional-flow-failed';this.failed=true;this.model.flowActive=false;this.release();}
    this.publish();
  }
  private publish(){
    if(!this.debug)return;
    const stamp=this.model.pointer.movedAt;
    if(stamp!==this.tailStamp){this.tailStamp=stamp;this.tailSamples=[];}
    const age=this.model.lastFrame-stamp;
    const thresholds=[0,250,1000,2000,2400];
    const next=thresholds[this.tailSamples.length];
    if(Number.isFinite(age)&&next!==undefined&&age>=next)
      this.tailSamples.push({age,amount:this.state.amount,cycles:this.cycles,active:this.model.flowActive,passes:this.passes});
    const owned=this.owned;
    document.body.dataset.homeFlow=JSON.stringify({active:this.model.flowActive,reason:this.reason,branch:this.state.branch,amount:this.state.amount,
      until:this.activity.until,lastInput:this.activity.stamp,cycles:this.cycles,copies:this.copies,resets:this.resets,passes:this.passes,clearPasses:this.clearPasses,
      size:owned?[owned.field.width,owned.field.height]:[],colorSize:owned?[owned.color.image.width,owned.color.image.height]:[],targets:owned?3:0,
      texture:owned?.field.texture.uuid,probe:this.probe,input:owned?.field.last??null,inputTrace:this.inputTrace,solveTrace:this.solveTrace,frameTrace:this.frameTrace,glassGuard:owned?{enabled:Boolean(owned.material.uniforms.protectGlass.value),bounds:this.glassBounds.toArray(),padding:.018,exterior:.065}:null,fixture:this.fixture||null,
      tailSamples:this.tailSamples,identityProbe:this.identityProbe,time:this.model.lastFrame,failed:this.failed,disposed:this.disposed});
  }
  private pixels(gl:WebGLRenderer){
    const context=gl.getContext(),w=gl.domElement.width,h=gl.domElement.height;
    return [[2,2],[w-3,2],[2,h-3],[w-3,h-3]].map(([x,y])=>{const value=new Uint8Array(4);context.readPixels(x,y,1,1,context.RGBA,context.UNSIGNED_BYTE,value);return [...value];});
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.model.flowActive=false;this.release();delete document.body.dataset.homeFlow;}
}
