import * as THREE from './node_modules/three/build/three.module.js';
import { FullScreenQuad } from './node_modules/three/examples/jsm/postprocessing/Pass.js';
import { makeTriangleGeometry } from './geometry.js';
import { BeamField, AIR_SCATTERING, AIR_EXTINCTION, KERNEL_RADIUS } from './beam-field.js';
import { makeReceiver, makeBackReceiver, ReceiverSurface } from './receiver.js';
import { RenderTiming } from './timing.js';
import { RenderScheduler } from './render-scheduler.js';
import {ObserverField} from './observer-field.js';
import {ObserverOptics,verifyObserver} from './observer-optics.js';
import {OpticalCache} from './optical-cache.js';

const canvas = document.querySelector('canvas'), status = document.querySelector('[role=status]');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(1); renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
const camera = new THREE.PerspectiveCamera(40, 1, .1, 50); camera.position.set(0, 0, 6);
const geometry = makeTriangleGeometry();
const field = new BeamField(geometry); scene.add(field.mesh);
const receiver = makeReceiver(), surface = new ReceiverSurface(receiver, KERNEL_RADIUS); scene.add(surface.mesh);
const backReceiver=makeBackReceiver(),backSurface=new ReceiverSurface(backReceiver,KERNEL_RADIUS);scene.add(backSurface.mesh);
const observerField=new ObserverField(),observer=new ObserverOptics(geometry,observerField);
const opticalCache=new OpticalCache(geometry,observer.material);
const prism = new THREE.Mesh(geometry,opticalCache.maskMaterial);prism.scale.setScalar(.5);scene.add(prism);
const target = new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});
const finishMaterial = new THREE.ShaderMaterial({ depthTest:false,depthWrite:false, uniforms:{ image:{value:target.texture},coarse:{value:opticalCache.coarse.texture},native:{value:opticalCache.native.texture},readyMask:{value:0},size:{value:new THREE.Vector2(1,1)},rect:{value:new THREE.Vector4(0,0,1,1)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D image,coarse,native;uniform int readyMask;uniform vec2 size;uniform vec4 rect;varying vec2 vUv;void main(){vec2 pixel=vUv*size;int x=0,y=0;for(int j=1;j<4;j++){if(pixel.x>=floor(rect.x+rect.z*float(j)/4.))x=j;if(pixel.y>=floor(rect.y+rect.w*float(j)/4.))y=j;}int tile=x+4*y;bool ready=(readyMask&(1<<tile))!=0;vec3 optical=ready?texture2D(native,vUv).rgb:texture2D(coarse,vUv).rgb;gl_FragColor=vec4(texture2D(image,vUv).rgb+optical,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
finishMaterial.fragmentShader = finishMaterial.fragmentShader.replace(';#include',';\n#include');
const finish = new FullScreenQuad(finishMaterial);
const timing = new RenderTiming(renderer,canvas);
function presentValidation(){renderer.setRenderTarget(null);finish.render(renderer);canvas.dataset.validationRedraws=String(Number(canvas.dataset.validationRedraws??0)+1);}
const cacheProbe=document.createElement('button');cacheProbe.textContent='验证缓存像素';document.querySelector('[data-action=probe]').after(cacheProbe);cacheProbe.addEventListener('click',()=>{const result=opticalCache.verify(renderer,camera);canvas.dataset.cacheProbe=JSON.stringify(result);presentValidation();status.textContent=`缓存像素验证：${result.passed?'通过':'未通过'} · 差异 ${result.differentPixels??'—'} · 有光像素 ${result.litPixels??'—'}`;});
const residualProbe=document.createElement('button');residualProbe.textContent='统计观察余量';cacheProbe.after(residualProbe);residualProbe.addEventListener('click',()=>{if(!observer.uniforms.diagnostic.value){status.textContent='先开启观察余量检查并等待最终像素完成';return;}if(opticalCache.needsMore){status.textContent='正在补齐最终观察像素，请稍后统计';return;}const result=opticalCache.residual(renderer);canvas.dataset.residualProbe=JSON.stringify(result);presentValidation();status.textContent=`观察余量 ${result.maxRemaining.toExponential(2)} · 超限 ${result.overThreshold} 像素 · 截断 ${result.capped} · 求交丢失 ${result.missed}`;});
let running=true,medium=true,source=true,count=32,epoch=0,dirty=true,disposed=false,ior=1.45,startedAt=performance.now(),readyAt=0,warming=true;
function rebuild(){prism.updateMatrixWorld(true);const receivers=[surface.mesh.visible?receiver:null,backSurface.mesh.visible?backReceiver:null].filter(Boolean),extinction=medium?AIR_EXTINCTION:0;
  field.rebuild(prism.matrixWorld,count,prism.visible,source?16:0,extinction,receivers,ior);surface.update(field.receiverHits.filter(h=>h.receiver===receiver),extinction);backSurface.update(field.receiverHits.filter(h=>h.receiver===backReceiver),extinction);
  observerField.update(field.records,receivers);observer.update(prism.matrixWorld,observerField,receivers,extinction,medium&&source?AIR_SCATTERING:0,ior);
  dirty=false;epoch++;status.textContent=`白光观察传输 · ${count} 源采样 · ${field.records.length} 传播段 · ${field.receiverHits.length} 接收面命中 · epoch ${epoch}`;canvas.dataset.epoch=String(epoch);canvas.dataset.samples=String(count);canvas.dataset.receiverHits=String(field.receiverHits.length);canvas.dataset.backHits=String(field.receiverHits.filter(h=>h.receiver===backReceiver).length);canvas.dataset.receiverFlux=String(field.receiverHits.reduce((sum,hit)=>sum+hit.power,0));canvas.dataset.ior=String(ior);canvas.dataset.photonNodes=String(observerField.nodeCount);}
function frame(time){if(disposed||document.hidden)return;
  let transportMs=null,sourceChanged=false,preview=dirty,tail=opticalCache.tailPending;if(!document.hidden&&(dirty||running&&count<128)){const begin=performance.now();if(running)count=Math.min(128,count+16);rebuild();transportMs=performance.now()-begin;sourceChanged=true;}
  field.material.uniforms.sigmaS.value=medium&&source?AIR_SCATTERING:0;field.material.uniforms.sigmaT.value=medium?AIR_EXTINCTION:0;
  timing.begin(time);if(sourceChanged){renderer.setScissorTest(false);renderer.setRenderTarget(target);renderer.render(scene,camera);opticalCache.reset(renderer,prism,camera,preview);}else opticalCache.tile(renderer,camera);
  timing.state=running&&count<128||opticalCache.needsMore?'running':'idle';finishMaterial.uniforms.readyMask.value=opticalCache.mask;finishMaterial.uniforms.rect.value.fromArray(opticalCache.rect);renderer.setRenderTarget(null);finish.render(renderer);timing.end(transportMs,count,sourceChanged?'source':tail?'observer-tail':`observer-tile-${opticalCache.next}`,epoch);
  canvas.dataset.medium=String(medium);canvas.dataset.glass=String(prism.visible);
  canvas.dataset.observerTiles=String(opticalCache.next);canvas.dataset.observerComplete=String(!opticalCache.needsMore);canvas.dataset.phase=sourceChanged?'source':'observer-tile';
  canvas.dataset.tailPixels=String(opticalCache.tailCount);
  if(timing.state==='idle'){readyAt=performance.now();canvas.dataset.convergenceMs=String(readyAt-startedAt);timing.flush();}
}
const scheduler=new RenderScheduler(frame,()=>dirty||running&&count<128||opticalCache.needsMore,{requestFrame:callback=>requestAnimationFrame(callback),cancelFrame:id=>cancelAnimationFrame(id),isHidden:()=>document.hidden});
function invalidate(){dirty=true;startedAt=performance.now();readyAt=0;if(!warming)scheduler.request();}
function resize(){const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);target.setSize(box.width,box.height);opticalCache.resize(box.width,box.height);finishMaterial.uniforms.size.value.set(box.width,box.height);camera.aspect=box.width/box.height;camera.position.z=camera.aspect<1?14/camera.aspect:6;camera.updateProjectionMatrix();invalidate();}
document.querySelector('[data-action=glass]').addEventListener('click',event=>{prism.visible=!prism.visible;count=32;invalidate();event.target.setAttribute('aria-pressed',String(prism.visible));});
document.querySelector('[data-action=volume]').addEventListener('click',event=>{medium=!medium;invalidate();event.target.setAttribute('aria-pressed',String(medium));});
document.querySelector('[data-action=light]').addEventListener('click',event=>{source=!source;invalidate();event.target.setAttribute('aria-pressed',String(source));});
document.querySelector('[data-action=receiver]').addEventListener('click',event=>{surface.mesh.visible=!surface.mesh.visible;invalidate();event.target.setAttribute('aria-pressed',String(surface.mesh.visible));});
document.querySelector('[data-action=back]').addEventListener('click',event=>{backSurface.mesh.visible=!backSurface.mesh.visible;invalidate();event.target.setAttribute('aria-pressed',String(backSurface.mesh.visible));});
document.querySelector('[data-action=ior]').addEventListener('click',event=>{ior=ior===1?1.45:1;count=32;invalidate();event.target.setAttribute('aria-pressed',String(ior===1));});
document.querySelector('[data-action=diagnostic]').addEventListener('click',event=>{observer.uniforms.diagnostic.value=!observer.uniforms.diagnostic.value;invalidate();event.target.setAttribute('aria-pressed',String(observer.uniforms.diagnostic.value));});
document.querySelector('[data-action=probe]').addEventListener('click',()=>{const result=verifyObserver(renderer,observer,geometry,prism.matrixWorld,camera,ior);canvas.dataset.observerProbe=JSON.stringify(result);presentValidation();let output=document.querySelector('[data-observer-probe]');if(!output){output=document.createElement('p');output.style.cssText='position:absolute;left:16px;top:30px;margin:0;font-size:12px;color:#aaa;pointer-events:none';output.setAttribute('data-observer-probe','');document.querySelector('main').append(output);}output.textContent=`实际GPU观察验证：${result.passed?'通过':'存在偏差'} · ${result.rays} 射线 · 方向误差 ${result.maxDirectionError.toExponential(2)} · 介质长度误差 ${result.maxMediumLengthError.toExponential(2)} · 能量余量 ${result.maxRemaining.toExponential(2)}`;});
document.querySelector('[data-action=turn]').addEventListener('click',event=>{prism.rotation.y=prism.rotation.y===0?.6:0;count=32;invalidate();event.target.setAttribute('aria-pressed',String(prism.rotation.y!==0));});
document.querySelector('[data-action=pause]').addEventListener('click',event=>{running=!running;event.target.textContent=running?'暂停源采样':'继续源采样';if(running&&count<128)scheduler.request();});
function visibilityChanged(){scheduler.visibilityChanged();timing.state=document.hidden?'hidden':dirty||running&&count<128||opticalCache.needsMore?'running':'idle';timing.publish();}
document.addEventListener('visibilitychange',visibilityChanged);
window.addEventListener('resize',resize);window.addEventListener('pagehide',()=>{disposed=true;scheduler.dispose();timing.dispose();document.removeEventListener('visibilitychange',visibilityChanged);window.removeEventListener('resize',resize);opticalCache.dispose();backSurface.dispose();observer.dispose();observerField.dispose();surface.dispose();field.dispose();geometry.dispose();target.dispose();finish.dispose();finishMaterial.dispose();renderer.dispose();},{once:true});
resize();
status.textContent='正在异步准备玻璃传输着色器';
await Promise.all([renderer.compileAsync(scene,camera),renderer.compileAsync(opticalCache.scene,camera),renderer.compileAsync(opticalCache.tailScene,camera)]);warming=false;canvas.dataset.prepared='true';if(!disposed){startedAt=performance.now();scheduler.request();}
