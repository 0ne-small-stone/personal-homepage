import {ShaderMaterial,Vector2} from './node_modules/three/build/three.module.js';
import {ObserverOptics,transportGLSL} from './observer-optics.js';
import {capAccelerator,capGLSL} from './cap-accelerator.js';
export const sellmeierGLSL=`float silicaIOR(float nm){float q=nm*nm*1e-6;return sqrt(1.+.6961663*q/(q-.0684043*.0684043)+.4079426*q/(q-.1162414*.1162414)+.8974794*q/(q-9.896161*9.896161));}`;
export const spectrumGLSL=transportGLSL
  .replace('uniform int nodeCount;','int nodeCount;int nodeBase,beamBase;uniform sampler2D spectralMeta;uniform int bandIndex,bandCount;uniform bool flatIOR,hasSource;')
  .replace('uniform float sigmaT,sigmaS,radius,ior,epsilon;','uniform float sigmaT,sigmaS,radius,epsilon;float ior;')
  .replace('float fieldRadiance',`vec4 nodeFetch(int index,int row){int id=(nodeBase+index)*2+row;return texelFetch(nodeMap,ivec2(id%256,id/256),0);}
    vec4 beamFetch(int index,int row){int id=(beamBase+index)*2+row;return texelFetch(beamMap,ivec2(id%256,id/256),0);}
    ${sellmeierGLSL}
    void setBand(int band){vec4 meta=texelFetch(spectralMeta,ivec2(band,0),0),color=texelFetch(spectralMeta,ivec2(band,1),0);nodeCount=int(meta.y);nodeBase=int(meta.z);beamBase=int(meta.w);ior=silicaIOR(flatIOR?550.:color.w);}
    float fieldRadiance`)
  .replaceAll('texelFetch(nodeMap,ivec2(cursor,0),0)','nodeFetch(cursor,0)')
  .replaceAll('texelFetch(nodeMap,ivec2(cursor,1),0)','nodeFetch(cursor,1)')
  .replaceAll('texelFetch(beamMap,ivec2(index,0),0)','beamFetch(index,0)')
  .replaceAll('texelFetch(beamMap,ivec2(index,1),0)','beamFetch(index,1)')
  .replace('float failureKind;',capGLSL+'float failureKind;')
  .replace('if(!glassHit(o,d,p,n,dist))','if(!internalHit(o,d,p,n,dist))');

export class SpectralObserver extends ObserverOptics{
  constructor(geometry,dummy){super(geometry,dummy);const original=this.material;
    const cap=capAccelerator(geometry);this.cap=cap;
    Object.assign(this.uniforms,{capEdges:{value:cap.edges},sidePlanes:{value:cap.sides.map(s=>s.plane)},sideExtents:{value:cap.sides.map(s=>s.extent)},capZ:{value:new Vector2(cap.min,cap.max)},accelerateCaps:{value:true},spectralMeta:{value:null},bandIndex:{value:0},bandCount:{value:0},flatIOR:{value:false},hasSource:{value:true},checker:{value:-1}});
    const prefix=original.fragmentShader.slice(0,original.fragmentShader.indexOf(transportGLSL));const vertex=original.vertexShader;
    this.material=new ShaderMaterial({toneMapped:false,uniforms:this.uniforms,defines:{...original.defines},vertexShader:vertex,fragmentShader:prefix+spectrumGLSL+`
      uniform int checker;varying vec3 vWorld;layout(location=1) out vec4 rayAnchor;
      void main(){if(checker>=0&&(int(gl_FragCoord.x)%2+2*(int(gl_FragCoord.y)%2))!=checker)discard;rayAnchor=vec4(vWorld,1.);if(!hasSource){gl_FragColor=vec4(0.);return;}setBand(bandIndex);float remaining;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remaining);gl_FragColor=vec4(vec3(value),remaining);}`});
    this.previewMaterial=new ShaderMaterial({toneMapped:false,uniforms:this.uniforms,defines:{...original.defines},vertexShader:vertex,fragmentShader:prefix+spectrumGLSL+`
      varying vec3 vWorld;void main(){vec3 result=vec3(0);if(hasSource){for(int band=0;band<64;band++){if(band>=bandCount)break;setBand(band);float remain;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remain);result+=value*texelFetch(spectralMeta,ivec2(band,1),0).rgb;}}gl_FragColor=vec4(result,1.);}`});
    this.tailMaterial=new ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:this.uniforms,defines:{...original.defines,OBSERVER_BOUNCES:512},vertexShader:`attribute vec3 anchor;attribute float waveIndex,previous;varying vec3 vWorld;varying float vBand,vPrevious;void main(){vWorld=anchor;vBand=waveIndex;vPrevious=previous;gl_Position=vec4(position.xy,0.,1.);gl_PointSize=1.;}`,fragmentShader:prefix+spectrumGLSL+`
      varying vec3 vWorld;varying float vBand,vPrevious;void main(){int band=int(vBand+.5);setBand(band);float remaining;float value=observe(cameraPosition,normalize(vWorld-cameraPosition),remaining);vec3 correction=(value-vPrevious)*texelFetch(spectralMeta,ivec2(band,1),0).rgb;gl_FragColor=vec4(correction,remaining);}`});original.dispose();
  }
  useAtlas(atlas,bands,flat,source){this.uniforms.beamMap.value=atlas.beams;this.uniforms.nodeMap.value=atlas.nodes;this.uniforms.spectralMeta.value=atlas.meta;this.uniforms.bandCount.value=bands.length;this.uniforms.flatIOR.value=flat;this.uniforms.hasSource.value=source;}
  dispose(){this.previewMaterial.dispose();this.tailMaterial.dispose();super.dispose();}
}
