import * as THREE from './node_modules/three/build/three.module.js';
import { FullScreenQuad } from './node_modules/three/examples/jsm/postprocessing/Pass.js';
import { makeTriangleGeometry } from './geometry.js';
import { BeamField, AIR_SCATTERING, AIR_EXTINCTION, KERNEL_RADIUS } from './beam-field.js';
import { makeReceiver, ReceiverSurface } from './receiver.js';
import { RenderTiming } from './timing.js';
import { RenderScheduler } from './render-scheduler.js';

const canvas = document.querySelector('canvas'), status = document.querySelector('[role=status]');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setPixelRatio(1); renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
const camera = new THREE.PerspectiveCamera(40, 1, .1, 50); camera.position.set(0, 0, 6);
const geometry = makeTriangleGeometry();
const prism = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: 'white', metalness: 0, transmission: 1, roughness: .025, ior: 1.45, thickness: .41 })); prism.scale.setScalar(.5); scene.add(prism);
const ambient = new THREE.HemisphereLight(0x333333, 0x000000, .5); scene.add(ambient);
const field = new BeamField(geometry); scene.add(field.mesh);
const receiver = makeReceiver(), surface = new ReceiverSurface(receiver, KERNEL_RADIUS); scene.add(surface.mesh);
const target = new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:true});
const finishMaterial = new THREE.ShaderMaterial({ depthTest:false,depthWrite:false, uniforms:{ image:{value:target.texture}},
  vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:'uniform sampler2D image;varying vec2 vUv;void main(){gl_FragColor=texture2D(image,vUv);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
finishMaterial.fragmentShader = finishMaterial.fragmentShader.replace(';#include',';\n#include');
const finish = new FullScreenQuad(finishMaterial);
const timing = new RenderTiming(renderer,canvas);
let running=true,medium=true,source=true,count=32,epoch=0,dirty=true,disposed=false;
function rebuild(){prism.updateMatrixWorld(true);field.rebuild(prism.matrixWorld,count,prism.visible,source?16:0,medium?AIR_EXTINCTION:0,surface.mesh.visible?receiver:null);surface.update(field.receiverHits,medium?AIR_EXTINCTION:0);dirty=false;epoch++;status.textContent=`白光单散射估计 · ${count} 源采样 · ${field.records.length} 传播段 · ${field.receiverHits.length} 接收面命中 · epoch ${epoch}`;canvas.dataset.epoch=String(epoch);canvas.dataset.samples=String(count);canvas.dataset.receiverHits=String(field.receiverHits.length);canvas.dataset.receiverFlux=String(field.receiverHits.reduce((sum,hit)=>sum+hit.power,0));}
function frame(time){if(disposed||document.hidden)return;
  let transportMs=null;if(!document.hidden&&(dirty||running&&count<128)){const begin=performance.now();if(running)count=Math.min(128,count+16);rebuild();transportMs=performance.now()-begin;}
  field.material.uniforms.sigmaS.value=medium&&source?AIR_SCATTERING:0;field.material.uniforms.sigmaT.value=medium?AIR_EXTINCTION:0;
  timing.state=running&&count<128?'running':'idle';timing.begin(time);renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);finish.render(renderer);timing.end(transportMs,count);
  canvas.dataset.medium=String(medium);canvas.dataset.glass=String(prism.visible);
  if(timing.state==='idle')timing.flush();
}
const scheduler=new RenderScheduler(frame,()=>dirty||running&&count<128,{requestFrame:callback=>requestAnimationFrame(callback),cancelFrame:id=>cancelAnimationFrame(id),isHidden:()=>document.hidden});
function invalidate(){dirty=true;scheduler.request();}
function resize(){const box=canvas.getBoundingClientRect();renderer.setSize(box.width,box.height,false);target.setSize(box.width,box.height);camera.aspect=box.width/box.height;camera.position.z=camera.aspect<1?14/camera.aspect:6;camera.updateProjectionMatrix();invalidate();}
document.querySelector('[data-action=glass]').addEventListener('click',event=>{prism.visible=!prism.visible;count=32;invalidate();event.target.setAttribute('aria-pressed',String(prism.visible));});
document.querySelector('[data-action=volume]').addEventListener('click',event=>{medium=!medium;invalidate();event.target.setAttribute('aria-pressed',String(medium));});
document.querySelector('[data-action=light]').addEventListener('click',event=>{source=!source;invalidate();event.target.setAttribute('aria-pressed',String(source));});
document.querySelector('[data-action=receiver]').addEventListener('click',event=>{surface.mesh.visible=!surface.mesh.visible;invalidate();event.target.setAttribute('aria-pressed',String(surface.mesh.visible));});
document.querySelector('[data-action=turn]').addEventListener('click',event=>{prism.rotation.y=prism.rotation.y===0?.6:0;count=32;invalidate();event.target.setAttribute('aria-pressed',String(prism.rotation.y!==0));});
document.querySelector('[data-action=pause]').addEventListener('click',event=>{running=!running;event.target.textContent=running?'暂停源采样':'继续源采样';if(running&&count<128)scheduler.request();});
function visibilityChanged(){scheduler.visibilityChanged();timing.state=document.hidden?'hidden':dirty||running&&count<128?'running':'idle';timing.publish();}
document.addEventListener('visibilitychange',visibilityChanged);
window.addEventListener('resize',resize);window.addEventListener('pagehide',()=>{disposed=true;scheduler.dispose();timing.dispose();document.removeEventListener('visibilitychange',visibilityChanged);window.removeEventListener('resize',resize);surface.dispose();field.dispose();geometry.dispose();prism.material.dispose();target.dispose();finish.dispose();finishMaterial.dispose();renderer.dispose();},{once:true});
resize();
