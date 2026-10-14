import * as THREE from './node_modules/three/build/three.module.js';
import { WebGLPathTracer, FogVolumeMaterial, PhysicalSpotLight } from './node_modules/three-gpu-pathtracer/src/index.js';
import { makeTriangleGeometry } from './geometry.js';

const canvas = document.querySelector('canvas'), status = document.querySelector('[role=status]');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0);
const camera = new THREE.PerspectiveCamera(40, 1, .1, 50); camera.position.set(0, 0, 6);
const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .005, transmission: 1, ior: 1.45, thickness: .41, attenuationDistance: 100, attenuationColor: 0xffffff, side: THREE.DoubleSide });
const prism = new THREE.Mesh(makeTriangleGeometry(), glass); prism.scale.setScalar(.5); scene.add(prism);
const fog = new FogVolumeMaterial({ density: .035, color: 0xffffff });
const volume = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 3), fog); scene.add(volume);
const receiver = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), new THREE.MeshStandardMaterial({ color: 0x242424, roughness: .95 }));
receiver.position.set(3.5, 0, -.7); receiver.rotation.y = -.5; scene.add(receiver);
const laser = new PhysicalSpotLight(0xffffff, 35000);
laser.position.set(-12, -12 * .2532532084998948, 0); laser.target.position.set(0, 0, 0);
laser.angle = .006; laser.penumbra = .15; laser.decay = 2; laser.radius = .003;
scene.add(laser, laser.target);
const fill = new THREE.RectAreaLight(0xffffff, .03, 3, .8); fill.position.set(0, 2, 2); fill.lookAt(0, 0, 0); scene.add(fill);
const pathTracer = new WebGLPathTracer(renderer);
pathTracer.renderDelay = 0; pathTracer.minSamples = 1; pathTracer.fadeDuration = 0;
pathTracer.dynamicLowRes = false; pathTracer.rasterizeScene = false;
pathTracer.bounces = 12; pathTracer.transmissiveBounces = 16;
pathTracer.tiles.set(2, 2); pathTracer.renderScale = .6; pathTracer.filterGlossyFactor = 0;
pathTracer.setScene(scene, camera);
let stopped = false, disposed = false, last = 0, targetSamples = 512;
function resize() {
  const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); pathTracer.updateCamera();
}
function render(time) {
  if (disposed) return;
  if (!stopped && !document.hidden && pathTracer.samples < targetSamples) pathTracer.renderSample();
  if (time - last > 400) {
    last = time;
    status.textContent = `${pathTracer.isCompiling ? '正在编译路径追踪' : stopped ? '累积已暂停' : 'GPU 路径追踪'} · ${pathTracer.samples.toFixed(0)} samples · ${fog.density === 0 ? '无散射介质' : '散射密度 ' + fog.density} · ${prism.visible ? '有玻璃' : '无玻璃'}`;
    canvas.dataset.samples = String(pathTracer.samples); canvas.dataset.renderer = 'three-gpu-pathtracer@0.0.27/WebGL2';
  }
  requestAnimationFrame(render);
}
document.querySelector('[data-action=pause]').addEventListener('click', event => { stopped = !stopped; event.target.textContent = stopped ? '继续累积' : '暂停累积'; });
document.querySelector('[data-action=volume]').addEventListener('click', event => { fog.density = fog.density === 0 ? .035 : 0; pathTracer.updateMaterials(); event.target.setAttribute('aria-pressed', String(fog.density > 0)); });
document.querySelector('[data-action=glass]').addEventListener('click', event => { prism.visible = !prism.visible; pathTracer.setScene(scene, camera); event.target.setAttribute('aria-pressed', String(prism.visible)); });
document.querySelector('[data-action=turn]').addEventListener('click', event => { prism.rotation.y = prism.rotation.y === 0 ? .6 : 0; pathTracer.setScene(scene, camera); event.target.setAttribute('aria-pressed', String(prism.rotation.y !== 0)); });
document.querySelector('[data-action=light]').addEventListener('click', event => { laser.intensity = laser.intensity === 0 ? 35000 : 0; pathTracer.updateLights(); event.target.setAttribute('aria-pressed', String(laser.intensity > 0)); });
window.addEventListener('resize', resize);
window.addEventListener('pagehide', () => {
  if (disposed) return; disposed = true; window.removeEventListener('resize', resize); pathTracer.dispose();
  scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); }); renderer.dispose();
}, { once: true });
resize(); requestAnimationFrame(render);
