import * as THREE from 'three';
import { createFieldQuery, FADE_START, FADE_END, ENTRY_PHOTO_HEIGHT } from './infinite-field.js';
import { createFlight, addWheel, advanceFlight, stopFlight, flightMoving } from './flight.js';
import { mountDome } from './dome.jsx';
import { createSideWall } from './side-wall.js';
import { createStarfield } from './starfield.js';
import { probe } from './performance-probe.js';
import {createSingleViewer} from './single-viewer.js';

const el = id => document.getElementById(id);
const stage = el('stage');
const shell = el('experience');
const domeHost=el('dome-host');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const forceReduced = new URL(location.href).searchParams.get('motion') === 'reduce';
const reduceMotion = () => forceReduced || reduced.matches;
const clamp = THREE.MathUtils.clamp;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const galleryInsets=()=>{const css=getComputedStyle(domeHost);return ['top','side','bottom'].map(side=>parseFloat(css.getPropertyValue(`--dome-${side}`)));};
const RADIUS = 6.2;
const ENTRY_Z = -45;
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const identity = new THREE.Quaternion();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, 1, .1, 500);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const rotation = new THREE.Quaternion();
const targetRotation = new THREE.Quaternion();
const turn = new THREE.Quaternion();
const radii = new THREE.Vector3(RADIUS, RADIUS, RADIUS);
const spaceOffset = new THREE.Vector3();
const entryAnchor = new THREE.Vector3();
const flight = createFlight();
const queryField=createFieldQuery();
let fieldView='',fieldPlanes=[];
let stageWidth=1,stageHeight=1,overviewInsets=[95,40,160];
let spaceScale = .08;
const tiles = [];
const textures = [];
const pointers = new Map();
const state = { phase: 'sphere', progress: 0, target: 0, returning:false, yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0, velocityYaw: 0, velocityPitch: 0, velocityX: 0, velocityY: 0, panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, distance: ENTRY_Z, targetDistance: ENTRY_Z, fieldOriginX: 0, fieldOriginY: 0, fieldOriginZ: 0, pointerX:0, pointerY:0, driftX:0, driftY:0, selectedPool: -1, selectedImage: -1, selectedKey:'', entrySelected: -1, hover: -1, pinch: 0 };
let photos = [];
let renderer;
let geometry;
let sphereCount = 0;
let sphereDistance = 18;
let overviewOffsetY = 0;
let domeApi;
let sideWall,starfield;
let overviewFov=46;
let overviewProjection=1200;
const viewOffset=new THREE.Vector2();
let queuedProgress=null;
let closingPhoto=false;
let queuedWheel=0;
let frame = 0;
let lastTime = performance.now();
let disposed = false;
let ready = false;
let modeText = '';
let dragging = false;
let viewer,pendingViewerResize=false;
let detailTexture;
let detailPool = -1;
let detailEpoch = 0;

const vertexShader = `
  varying vec2 vUv;
  uniform float uProgress;
  uniform vec2 uSize;
  void main() {
    vUv = uv;
    vec3 p = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uSpherePhoto;
  uniform sampler2D uFieldPhoto;
  uniform float uSphereAspect;
  uniform float uFieldAspect;
  uniform float uProgress;
  uniform float uOpacity;
  uniform float uHighlight;
  uniform float uFog;
  uniform vec2 uSize;
  vec2 cover(vec2 uv, float photoAspect) {
    float frameAspect = uSize.x / uSize.y;
    vec2 scale = photoAspect > frameAspect ? vec2(frameAspect / photoAspect, 1.0) : vec2(1.0, photoAspect / frameAspect);
    return (uv - 0.5) * scale + 0.5;
  }
  void main() {
    float radius = mix(0.075, 0.012, uProgress);
    vec2 q = abs(vUv - 0.5) - vec2(0.5 - radius);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
    float edge = 1.0 - smoothstep(-0.004, 0.002, d);
    if (edge < 0.01) discard;
    vec3 a = texture2D(uSpherePhoto, cover(vUv, uSphereAspect)).rgb;
    vec3 b = texture2D(uFieldPhoto, cover(vUv, uFieldAspect)).rgb;
    vec3 color = mix(a, b, smoothstep(0.22, 0.82, uProgress));
    float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(grey), color, mix(0.6, 1.0, max(uHighlight, uProgress)));
    color *= mix(0.82, 1.0, max(uHighlight,uProgress));
    color *= uFog;
    float border = smoothstep(-max(fwidth(d) * 1.8, 0.003), -0.001, d) * uHighlight;
    color = mix(color, vec3(0.86), border * 0.85);
    gl_FragColor = vec4(color, edge * uOpacity);
    #include <colorspace_fragment>
  }
`;

function schedule(resetClock = true) {
  if (!frame && ready && !disposed && !document.hidden && !viewer?.isOpen) {
    if(resetClock) lastTime=performance.now();
    frame = requestAnimationFrame(tick);
  }
}

function sphereRotation() {
  if(domeApi){const pose=domeApi.rotation;rotation.setFromEuler(new THREE.Euler(-THREE.MathUtils.degToRad(pose.x),THREE.MathUtils.degToRad(pose.y),0,'XYZ'));}
  return rotation;
}

function rotateOverview(yaw, pitch) {
  domeApi?.rotate(THREE.MathUtils.radToDeg(yaw),-THREE.MathUtils.radToDeg(pitch));
}

function ellipsoidPose(tile, position, quaternion) {
  position.copy(tile.base);quaternion.copy(tile.sphereQuat);
}

function photoAspect(index) { return photos[index].width / photos[index].height; }

function overviewSize(tile) {
  return tile.baseSize.clone();
}

function overviewImageSize(tile){
  const size=overviewSize(tile),aspect=photoAspect(tile.sphereImage);
  const width=Math.min(size.x,size.y*aspect);
  return new THREE.Vector2(width,width/aspect);
}

function cssPose(item,radius){
  const m=item.matrix;
  const scale=radius/RADIUS;
  const matrix=new THREE.Matrix4().fromArray(m);
  // CSS Y points down. Conjugating by Y reflection preserves a proper rotation.
  const reflection=new THREE.Matrix4().makeScale(1,-1,1);
  matrix.premultiply(reflection).multiply(reflection);
  const quaternion=new THREE.Quaternion().setFromRotationMatrix(matrix);
  const position=new THREE.Vector3(m[12],-m[13],m[14]+radius).divideScalar(scale);
  const width=(radius*3.14/34*2-20)/scale;
  return {position,quaternion,size:new THREE.Vector2(width,width)};
}

function refreshDomePoses(){
  const snapshot=domeApi.snapshot();
  for(const item of snapshot.items){
    const tile=tiles[item.index],pose=cssPose(item,snapshot.radius);
    tile.base.copy(pose.position);tile.sphereQuat.copy(pose.quaternion);tile.baseSize.copy(pose.size);
  }
  return snapshot;
}

async function loadEntryDetail(pool) {
  const epoch=++detailEpoch;
  if(detailTexture) {
    detailTexture.dispose();detailTexture=undefined;
    domeApi?.detail(detailPool,false);
  }
  domeApi?.detail(pool,true);
  shell.dataset.detail='loading';
  try {
    const texture=await new THREE.TextureLoader().loadAsync(photos[tiles[pool].sphereImage].full);
    if(disposed||epoch!==detailEpoch) { texture.dispose();return; }
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    detailPool=pool;detailTexture=texture;
    shell.dataset.detail='ready';schedule();
  } catch { if(epoch===detailEpoch) shell.dataset.detail='thumbnail'; }
}

function addTile(image, base = null, sphereQuat = identity, longitude = 0, latitude = 0) {
  // CSS3D already draws the overview. Keep only its pose for the shared camera.
  if(base){
    const tile={base,sphereQuat,longitude,latitude,sphereImage:image,sphereStart:base.clone(),sphereStartQuat:sphereQuat.clone()};
    tiles.push(tile);return tile;
  }
  const material = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent:true, depthWrite:true,
    uniforms: { uSpherePhoto:{value:textures[image]},uFieldPhoto:{value:textures[image]},uSphereAspect:{value:photoAspect(image)},uFieldAspect:{value:photoAspect(image)},uProgress:{value:0},uOpacity:{value:1},uHighlight:{value:0},uFog:{value:1},uSize:{value:new THREE.Vector2(1.35,1.55)} }
  });
  const mesh = new THREE.Mesh(geometry,material);
  mesh.userData.pool = tiles.length;
  scene.add(mesh);
  const tile = {mesh,material,base,sphereQuat,longitude,latitude,sphereImage:image,fieldImage:image,sphereStart:base?.clone() ?? new THREE.Vector3(),sphereStartQuat:sphereQuat.clone(),field:new THREE.Vector3(),fieldSize:new THREE.Vector2(),fieldKey:'',fieldActive:false,fieldOpacity:0};
  tiles.push(tile);
  return tile;
}

function createTiles() {
  const selected=state.selectedImage;
  detailEpoch++;
  detailTexture?.dispose();detailTexture=undefined;detailPool=-1;
  for(const tile of tiles) { if(tile.mesh)scene.remove(tile.mesh);tile.material?.dispose(); }
  tiles.length=0;
  state.selectedPool=state.hover=-1;
  geometry??=new THREE.PlaneGeometry(1, 1);
  const snapshot=domeApi.snapshot();
  for(const item of snapshot.items) {
    const pose=cssPose(item,snapshot.radius);
    const image=Math.max(0,photos.findIndex(photo=>photo.image===item.src));
    const tile=addTile(image,pose.position,pose.quaternion);
    tile.baseSize=pose.size;
  }
  sphereCount = tiles.length;
  stage.dataset.overview=String(sphereCount);
  stage.dataset.pool = String(sphereCount);
  stage.dataset.fieldPool='0';
  if(selected>=0) {
    const pool=domeApi.find(photos[selected].image);
    setSelection(pool);state.entrySelected=pool;
  }
}

function setFieldPlane(tile, plane) {
  const image = plane.key === 'anchor' ? tiles[state.entrySelected].sphereImage : plane.media % photos.length;
  if(tile.fieldKey!==plane.key) tile.fieldOpacity=0;
  tile.fieldKey = plane.key;
  tile.fieldActive = true;
  tile.fieldLeaving = false;
  tile.fieldImage = image;
  tile.material.uniforms.uFieldPhoto.value = plane.key==='anchor'&&detailTexture?detailTexture:textures[image];
  tile.material.uniforms.uFieldAspect.value = photoAspect(image);
  tile.fieldSize.set(plane.height * photoAspect(image)*spaceScale,plane.height*spaceScale);
  tile.field.set(plane.x-state.fieldOriginX,plane.y-state.fieldOriginY,plane.z-state.fieldOriginZ).multiplyScalar(spaceScale).add(spaceOffset);
}

function defineField() {
  fieldView='';fieldPlanes=[];
  state.fieldOriginX = state.fieldOriginY = state.fieldOriginZ = 0;
  state.selectedKey = 'anchor';
  for(const tile of tiles.slice(sphereCount)) { tile.fieldActive=false;tile.fieldKey='';tile.fieldOpacity=0; }
}

function recycleField() {
  const globalCamera = {x:(camera.position.x-spaceOffset.x)/spaceScale+state.fieldOriginX,y:(camera.position.y-spaceOffset.y)/spaceScale+state.fieldOriginY,z:(camera.position.z-spaceOffset.z)/spaceScale+state.fieldOriginZ};
  const view=[globalCamera.x,globalCamera.y,globalCamera.z,camera.aspect,state.phase,state.returning].join(',');
  if(view!==fieldView){
    fieldPlanes=probe.measure('candidates',()=>queryField(globalCamera,camera.aspect,tiles[state.entrySelected].sphereImage,plane=>photoAspect(plane.key==='anchor'?tiles[state.entrySelected].sphereImage:plane.media%photos.length))).filter(plane=>state.phase==='space'||state.returning||plane.z<-22);
    fieldView=view;
  }
  const planes=fieldPlanes;
  const wanted = new Set(planes.map(p=>p.key));
  const retained = new Map();
  const free = [];
  for (const tile of tiles.slice(sphereCount)) {
    if (tile.fieldActive && wanted.has(tile.fieldKey)) retained.set(tile.fieldKey,tile);
    else if(tile.fieldActive&&tile.fieldOpacity>.005){tile.fieldLeaving=true;}
    else { tile.fieldActive=false;free.push(tile); }
  }
  for (const plane of planes){
    const tile=retained.get(plane.key)??free.pop()??(tiles.length-sphereCount<640?addTile(plane.media%photos.length):null);
    if(tile)setFieldPlane(tile,plane);
  }
  stage.dataset.pool=String(tiles.length);
  stage.dataset.fieldPool=String(tiles.length-sphereCount);
  shell.dataset.regions=String(new Set(planes.map(p=>p.key.split(':')[0])).size);
  shell.dataset.fieldCount=String(planes.length);
  shell.dataset.fieldLayout='projection-gap';
  shell.dataset.fieldRetiring=String(tiles.slice(sphereCount).filter(tile=>tile.fieldActive&&tile.fieldLeaving).length);
}

function nearest() {
  return domeApi.find();
}

function setSelection(pool, center = false) {
  const tile = tiles[pool];
  state.selectedPool = pool;
  state.selectedImage = tile.base ? tile.sphereImage : tile.fieldImage;
  if (!tile.base) state.selectedKey=tile.fieldKey;
  el('selection').textContent = photos[state.selectedImage].title;
  el('view-photo').disabled = false;
  if (center && state.phase === 'sphere') {
    domeApi.openIndex(pool);
  }else if(center&&state.phase==='space'){
    showPhoto(tile.fieldImage,pool);
  }
  schedule();
}

function beginEntry() {
  domeApi.freeze();
  refreshDomePoses();
  if (state.selectedPool < 0) setSelection(state.hover >= 0 ? state.hover : nearest());
  state.entrySelected = state.selectedPool;
  loadEntryDetail(state.entrySelected);
  state.velocityYaw = state.velocityPitch = 0;
  state.targetYaw = state.yaw;
  state.targetPitch = state.pitch;
  targetRotation.copy(rotation);
  sphereRotation();
  for (const tile of tiles.slice(0,sphereCount)) {
    ellipsoidPose(tile, tile.sphereStart, tile.sphereStartQuat);
  }
  state.panX = state.panY = state.targetPanX = state.targetPanY = 0;
  entryAnchor.copy(tiles[state.entrySelected].sphereStart);
  spaceOffset.copy(entryAnchor);
  spaceScale=overviewImageSize(tiles[state.entrySelected]).y/ENTRY_PHOTO_HEIGHT;
  state.distance = state.targetDistance = ENTRY_Z;
  state.returning=false;
  stopFlight(flight);
  state.velocityX=state.velocityY=state.driftX=state.driftY=0;
  defineField();
  state.phase = 'transition';
}

function beginExit() {
  // Shift the world origin and camera together: returning from far away has no jump.
  const shift = new THREE.Vector3(state.panX+state.driftX,state.panY+state.driftY,state.distance-ENTRY_Z);
  state.fieldOriginX += shift.x;
  state.fieldOriginY += shift.y;
  state.fieldOriginZ += shift.z;
  spaceOffset.addScaledVector(shift,spaceScale);
  state.panX = state.panY = state.targetPanX = state.targetPanY = 0;
  state.driftX=state.driftY=state.pointerX=state.pointerY=state.velocityX=state.velocityY=0;
  state.distance = state.targetDistance = ENTRY_Z;
  state.returning=true;
  stopFlight(flight);
  state.phase = 'transition';
}

function progressTo(value) {
  if (!ready || disposed || viewer?.isOpen || !renderer) return;
  const target = clamp(value, 0, 1);
  if(state.phase==='sphere'&&domeApi.isOpen){
    queuedProgress=target;
    if(target<1)queuedWheel=0;
    if(!closingPhoto){
      closingPhoto=true;
      domeApi.close().then(()=>{closingPhoto=false;const next=queuedProgress;queuedProgress=null;if(next!==null){progressTo(next);if(queuedWheel){const carry=queuedWheel;queuedWheel=0;zoomBy(carry);}}});
    }
    return;
  }
  if (target > 0 && state.phase === 'sphere') beginEntry();
  if (target < 1 && state.phase === 'space') beginExit();
  state.target = target;
  if(target<1) stopFlight(flight);
  state.hover = -1;
  schedule();
}

function zoomBy(delta) {
  if (!ready || viewer?.isOpen || !renderer) return;
  if (state.phase === 'space') {
    if(reduceMotion()) state.distance=state.targetDistance=state.distance+delta*.3;
    else addWheel(flight,delta);
  } else {
    const target=(queuedProgress??state.target)-delta/900;
    progressTo(target);
    if(target>1) {
      const remainder=-(target-1)*900;
      if(queuedProgress!==null) queuedWheel+=remainder;
      else if(reduceMotion()) state.distance=state.targetDistance=state.distance+remainder*.3;
      else addWheel(flight,remainder);
    }
  }
  schedule();
}

function updateUI() {
  const text = state.phase === 'space' ? '影像空间' : state.phase === 'sphere' ? '椭球总览' : state.target >= state.progress ? '正在进入深处' : '正在收回总览';
  if (text !== modeText) {
    modeText = text;
    el('mode').textContent = text;
    el('hint').textContent = state.phase === 'space' ? '拖动平移 · 滚轮穿行 · Esc 返回总览' : state.phase === 'sphere' ? '上下左右拖动旋转 · 点击选中 · 滚轮进入' : '继续放大进入 · 反向滚轮收回';
    el('enter').textContent = state.phase === 'space' ? '回到总览' : '进入空间';
  }
  el('return').disabled = state.phase === 'sphere';
  el('journey').value = String(Math.round(state.target * 100));
  shell.dataset.view = state.phase;
  shell.dataset.progress = state.progress.toFixed(3);
  shell.dataset.pan = `${state.panX.toFixed(2)},${state.panY.toFixed(2)}`;
  shell.dataset.distance = state.distance.toFixed(2);
  shell.dataset.orientation = `${state.yaw.toFixed(3)},${state.pitch.toFixed(3)}`;
  shell.dataset.quaternion=rotation.toArray().map(v=>v.toFixed(5)).join(',');
  shell.dataset.rotationMode='dome-limited-pitch';
  shell.dataset.layout='react-bits-dome';
  shell.dataset.imageFit='contain';
  shell.dataset.domeRadius=String(domeApi.radius);
  shell.dataset.camera = `${(state.panX+state.fieldOriginX).toFixed(2)},${(state.panY+state.fieldOriginY).toFixed(2)},${(state.distance+state.fieldOriginZ).toFixed(2)}`;
  shell.dataset.actualCamera = camera.position.toArray().map(v=>v.toFixed(4)).join(',');
  shell.dataset.portal = entryAnchor.toArray().map(v=>v.toFixed(4)).join(',');
  shell.dataset.flightVelocity = flight.velocity.toFixed(4);
}

function update(dt) {
  if(viewer?.isOpen) return false;
  const follow = reduceMotion() ? 1 : 1 - Math.exp(-dt / (state.phase==='space' ? .10 : .18));
  if(state.phase==='sphere'){
    const pose=domeApi.rotation;
    state.pitch=state.targetPitch=-THREE.MathUtils.degToRad(pose.x);
    state.yaw=state.targetYaw=THREE.MathUtils.degToRad(pose.y);
    // A transform-only CSS gallery needs no Three draw, projection, or nearest-card scan.
    camera.position.set(0,overviewOffsetY,sphereDistance);
    renderer.domElement.style.opacity='0';renderer.domElement.tabIndex=-1;
    shell.dataset.starfield='hidden';sphereRotation();updateUI();return false;
  }
  if (state.phase === 'space') {
    if (!pointers.size && !reduceMotion()) {
      state.targetPanX += state.velocityX*dt;
      state.targetPanY += state.velocityY*dt;
      state.velocityX *= Math.exp(-dt/.16);
      state.velocityY *= Math.exp(-dt/.16);
    }
    if (!pointers.size) {
      const drift = reduceMotion() ? 0 : 8*clamp((state.distance+state.fieldOriginZ-ENTRY_Z+50)/50,.3,2);
      const driftFollow=reduceMotion()?1:1-Math.pow(Math.abs(flight.velocity)>.05?.8:.88,dt*60);
      state.driftX += (state.pointerX*drift-state.driftX)*driftFollow;
      state.driftY += (state.pointerY*drift-state.driftY)*driftFollow;
    }
  }
  for (const [current, target] of [['yaw','targetYaw'],['pitch','targetPitch'],['panX','targetPanX'],['panY','targetPanY']]) state[current] += (state[target] - state[current]) * follow;
  if(state.phase==='space'||(!state.returning&&state.phase==='transition'&&state.target===1)) {
    state.distance += advanceFlight(flight,dt);
    state.targetDistance=state.distance;
    if(state.phase==='space'&&state.distance+state.fieldOriginZ>60&&Math.hypot(state.panX+state.fieldOriginX,state.panY+state.fieldOriginY)<55) progressTo(.96);
  }
  state.progress += (state.target - state.progress) * follow;
  if (state.phase === 'transition' && Math.abs(state.progress - state.target) < .0005) {
    state.progress = state.target;
    if (state.target === 1) {
      state.phase = 'space';
      if(domeHost.contains(document.activeElement))renderer.domElement.focus({preventScroll:true});
    }
    else if (state.target === 0) {
      state.phase = 'sphere';
      state.panX = state.panY = state.targetPanX = state.targetPanY = 0;
      stopFlight(flight);
      setSelection(state.entrySelected);
      domeApi.resume();
      resize();
      if(document.activeElement===renderer.domElement)domeHost.querySelector('.sphere-main').focus({preventScroll:true});
      sideWall?.setProgress(0);shell.style.setProperty('--unfold','0');
      domeHost.style.inset='';domeHost.style.opacity='';renderer.domElement.style.opacity='0';renderer.domElement.tabIndex=-1;
      shell.dataset.starfield='hidden';updateUI();return false;
    }
  }
  const p = state.progress;
  sideWall?.setProgress(p);
  shell.style.setProperty('--unfold',String(p));
  if (state.phase === 'sphere') sphereRotation();
  camera.fov = THREE.MathUtils.lerp(overviewFov,60,p);
  camera.near=THREE.MathUtils.lerp(.1,spaceScale,p);
  camera.setViewOffset(stageWidth,stageHeight,viewOffset.x*(1-p),viewOffset.y*(1-p),stageWidth,stageHeight);
  camera.updateProjectionMatrix();
  const destination=new THREE.Vector3(state.panX+state.driftX,state.panY+state.driftY,state.distance).multiplyScalar(spaceScale).add(spaceOffset);
  camera.position.set(0,overviewOffsetY,sphereDistance).lerp(destination,p);
  camera.quaternion.identity();
  camera.updateMatrixWorld();
  starfield?.update(p,camera.aspect,camera.fov,(camera.position.x-spaceOffset.x)/spaceScale+state.fieldOriginX,(camera.position.y-spaceOffset.y)/spaceScale+state.fieldOriginY);
  shell.dataset.starfield=p>.25?'subtle':'hidden';
  if(p>0&&p<1){
    const [top,side,bottom]=overviewInsets;
    domeHost.style.inset=`${top*(1-p)}px ${side*(1-p)}px ${bottom*(1-p)}px`;
    domeHost.style.opacity=String(1-smooth(.78,.97,p));
    const projection=stageHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
    domeApi.camera({position:camera.position,projection,p});
  }else if(p===0){domeHost.style.inset='';domeHost.style.opacity='';}
  renderer.domElement.style.opacity=p>0?'1':'0';
  renderer.domElement.tabIndex=state.phase==='sphere'?-1:0;
  if(p>0) recycleField();
  let opacityMoving=false;
  let aspectError=0;
  for (const [index, tile] of tiles.entries()) {
    const overview=!!tile.base;
    if(overview)continue;
    const mesh = tile.mesh;
    mesh.visible = tile.fieldActive&&p>0;
    if (!mesh.visible) continue;
    if (overview && state.phase === 'sphere') {
      ellipsoidPose(tile, mesh.position, mesh.quaternion);
    } else if(overview) {
      mesh.position.copy(tile.sphereStart);
      mesh.quaternion.copy(tile.sphereStartQuat);
    } else {
      mesh.position.copy(tile.field);
      mesh.quaternion.identity();
    }
    const selected = overview ? index === (state.phase==='sphere'?state.selectedPool:state.entrySelected) : tile.fieldKey === state.selectedKey && tile.fieldImage === state.selectedImage;
    const active = selected ? 1 : index === state.hover ? .42 : 0;
    const bump = 1 + active * .035;
    const size = overview ? overviewSize(tile) : tile.fieldSize;
    const w = size.x * bump;
    const h = size.y * bump;
    mesh.scale.set(w, h, 1);
    aspectError=Math.max(aspectError,Math.abs(w/h/photoAspect(overview?tile.sphereImage:tile.fieldImage)-1));
    const depth = camera.position.z - mesh.position.z;
    const fieldDepth=depth/spaceScale;
    const distanceFade = Math.pow(clamp(1-(fieldDepth-FADE_START)/(FADE_END-FADE_START),0,1),2)*smooth(1,3,fieldDepth);
    tile.material.uniforms.uProgress.value = overview?0:1;
    tile.material.uniforms.uSize.value.set(w, h);
    tile.material.uniforms.uHighlight.value = active;
    tile.material.uniforms.uFog.value=overview?1:1-clamp((fieldDepth-120)/200,0,1);
    const fieldTarget=tile.fieldLeaving?0:distanceFade;
    tile.fieldOpacity += (fieldTarget-tile.fieldOpacity)*(reduceMotion()?1:1-Math.pow(.82,dt*60));
    if(!overview&&Math.abs(fieldTarget-tile.fieldOpacity)>.0008) opacityMoving=true;
    const opacity = tile.fieldOpacity*smooth(.15,.55,p);
    tile.material.uniforms.uOpacity.value = opacity;
    tile.material.depthWrite = opacity > .99 || state.phase === 'sphere';
    mesh.updateMatrixWorld();
  }
  probe.measure('render',()=>renderer.render(scene, camera));probe.count('renders');probe.count('drawCalls',renderer.info.render.calls);
  shell.dataset.aspectError=aspectError.toExponential(3);
  const anchorTile=tiles[state.entrySelected];
  shell.dataset.anchorPose=anchorTile.sphereStart.toArray().map(v=>v.toFixed(4)).join(',');
  updateUI();
  const driftAmount=8*clamp((state.distance+state.fieldOriginZ-ENTRY_Z+50)/50,.3,2);
  const driftMoving = state.phase==='space' && !reduceMotion() && (Math.abs(state.pointerX*driftAmount-state.driftX)>.001 || Math.abs(state.pointerY*driftAmount-state.driftY)>.001);
  return opacityMoving || flightMoving(flight) || driftMoving || Math.abs(state.target - p) > .0002 || Math.abs(state.targetPanX - state.panX) > .001 || Math.abs(state.targetPanY - state.panY) > .001 || Math.abs(state.velocityX)>.001 || Math.abs(state.velocityY)>.001;
}

function tick(time) {
  frame = 0;
  if (disposed || document.hidden) return;
  const dt = clamp((time - lastTime) / 1000, .001, .05);
  lastTime = time;
  probe.phase(state.phase);probe.frame(time);
  const moving=probe.measure('update',()=>update(dt));probe.flush(!moving);
  if (moving) schedule(false);
}

function resize() {
  if(viewer?.isOpen){pendingViewerResize=true;return;}
  if (!renderer || !domeApi) return;
  const { width, height } = stage.getBoundingClientRect();
  stageWidth=width;stageHeight=height;overviewInsets=galleryInsets();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  const [top,,bottom]=overviewInsets;
  radii.setScalar(RADIUS);
  overviewProjection=2*domeApi.radius;
  overviewFov=THREE.MathUtils.radToDeg(2*Math.atan(height/(2*overviewProjection)));
  sphereDistance=3*RADIUS;
  overviewOffsetY=0;
  viewOffset.set(0,(bottom-top)/2);
  shell.dataset.axes = `${radii.x.toFixed(3)},${radii.y.toFixed(3)},${radii.z.toFixed(3)}`;
  shell.dataset.layoutAspect=(width/height).toFixed(3);
  if(!sphereCount) createTiles();
  else if(state.phase==='sphere') refreshDomePoses();
  if(state.phase==='sphere')sideWall?.resize(domeApi.radius);
  if (ready) { update(.02); schedule(); }
}

function hitAt(x, y) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(tiles.filter(tile=>tile.mesh?.visible && tile.material.uniforms.uOpacity.value>.12).map(tile => tile.mesh), false);
  for (const hit of hits) {
    const uv = hit.uv;
    if (!uv) continue;
    const radius = hit.object.userData.pool<sphereCount?.075:.012;
    const qx = Math.abs(uv.x - .5) - (.5-radius);
    const qy = Math.abs(uv.y - .5) - (.5-radius);
    if (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius > 0) continue;
    return hit.object.userData.pool;
  }
  return -1;
}

function wireCanvas() {
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'region');
  canvas.setAttribute('aria-label', '椭球照片与无限影像空间。拖拽旋转或平移，滚轮穿行。方向键平移，W/S前后，Q/E升降，Enter进入，Esc返回。');
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1;
    zoomBy(clamp(e.deltaY * unit, -500, 500));
  }, { passive: false });
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false, time: e.timeStamp });
    state.velocityYaw = state.velocityPitch = state.velocityX = state.velocityY = 0;
    if (pointers.size === 2) {
      const points = [...pointers.values()];
      state.pinch = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      for (const point of points) point.moved = true;
    }
  });
  canvas.addEventListener('pointermove', e => {
    const point = pointers.get(e.pointerId);
    if (!point) {
      const rect = canvas.getBoundingClientRect();
      state.pointerX=(e.clientX-rect.left)/rect.width*2-1;
      state.pointerY=1-(e.clientY-rect.top)/rect.height*2;
      const hovered = hitAt(e.clientX, e.clientY);
      if (hovered !== state.hover) { state.hover = hovered; schedule(); }
      if(state.phase==='space') schedule();
      return;
    }
    const dx = e.clientX - point.x;
    const dy = e.clientY - point.y;
    const elapsed = Math.max(.01, (e.timeStamp - point.time) / 1000);
    point.x = e.clientX; point.y = e.clientY; point.time = e.timeStamp;
    if (Math.hypot(e.clientX - point.startX, e.clientY - point.startY) > 7) point.moved = true;
    if (pointers.size === 2) {
      const points = [...pointers.values()];
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (state.pinch > 0) zoomBy(-Math.log(distance / state.pinch) * 900);
      state.pinch = distance;
    } else if (point.moved) {
      dragging = true;
      canvas.classList.add('dragging');
      if (state.phase === 'sphere') {
        const factor=5.2/Math.min(canvas.clientWidth,canvas.clientHeight);
        const yaw=dx*factor;
        const pitch=dy*factor;
        rotateOverview(yaw,pitch);
        state.velocityYaw = reduceMotion() ? 0 : clamp(yaw / elapsed, -1.4, 1.4);
        state.velocityPitch = reduceMotion() ? 0 : clamp(pitch / elapsed, -1.4, 1.4);
      } else {
        const factor = 1.7 * 2 * 50 * Math.tan(Math.PI/6) / canvas.clientHeight;
        state.targetPanX -= dx * factor;
        state.targetPanY += dy * factor;
        state.velocityX=reduceMotion()?0:clamp(-dx*factor/elapsed,-28,28);
        state.velocityY=reduceMotion()?0:clamp(dy*factor/elapsed,-28,28);
      }
    }
    schedule();
  });
  const release = (e, cancelled) => {
    const point = pointers.get(e.pointerId);
    if (!point) return;
    if (!cancelled && !point.moved && pointers.size === 1) {
      const hit = hitAt(e.clientX, e.clientY);
      if (hit >= 0) setSelection(hit, true);
    }
    pointers.delete(e.pointerId);
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (pointers.size === 1) for (const p of pointers.values()) { p.startX = p.x; p.startY = p.y; p.moved = true; }
    if (!pointers.size) { state.pinch = 0; dragging = false; canvas.classList.remove('dragging'); }
    if (cancelled) state.velocityYaw = state.velocityPitch = state.velocityX = state.velocityY = 0;
    schedule();
  };
  canvas.addEventListener('pointerup', e => release(e, false));
  canvas.addEventListener('pointercancel', e => release(e, true));
  canvas.addEventListener('pointerleave', () => { if (!dragging) { state.hover = -1; state.pointerX=state.pointerY=0; schedule(); } });
  canvas.addEventListener('keydown', e => {
    if (viewer?.isOpen) return;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (state.phase === 'sphere') {
        rotateOverview(e.key === 'ArrowLeft' ? -.16 : e.key === 'ArrowRight' ? .16 : 0,e.key === 'ArrowUp' ? -.16 : e.key === 'ArrowDown' ? .16 : 0);
      } else {
        state.targetPanX += e.key === 'ArrowLeft' ? -8 : e.key === 'ArrowRight' ? 8 : 0;
        state.targetPanY += e.key === 'ArrowUp' ? 8 : e.key === 'ArrowDown' ? -8 : 0;
      }
      schedule();
    }
    if (e.key === 'Enter') { e.preventDefault(); progressTo(1); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(-250); }
    if (e.key === '-') { e.preventDefault(); zoomBy(250); }
    if (state.phase==='space' && ['w','s','a','d','q','e'].includes(e.key.toLowerCase())) {
      e.preventDefault();
      const key=e.key.toLowerCase();
      if(key==='w'||key==='s') zoomBy(key==='w'?-100:100);
      else if(key==='a'||key==='d') state.targetPanX+=key==='a'?-8:8;
      else state.targetPanY+=key==='q'?-8:8;
      schedule();
    }
  });
}

function photoOrigin(image,pool=state.selectedPool){
  if(state.phase==='sphere'&&domeApi){
    if(!tiles[pool]?.base||tiles[pool].sphereImage!==image)pool=domeApi.find(photos[image].image);
    const shot=domeApi.snapshot(pool),item=shot.items[0];if(!item)return null;
    const m=item.matrix;if(m[10]<=0)return null;
    const edge=shot.radius*3.14/34*2-20,ratio=photoAspect(image),w=Math.min(edge,edge*ratio),h=w/ratio;
    const quad=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>{
      const z=m[2]*x+m[6]*y+m[14],factor=2*shot.radius/(2*shot.radius-z);
      return {x:shot.rect.x+shot.rect.width/2+(m[0]*x+m[4]*y+m[12])*factor,y:shot.rect.y+shot.rect.height/2+(m[1]*x+m[5]*y+m[13])*factor};
    });
    return {quad,element:domeHost.querySelector(`.item[data-pool="${pool}"] .item__image`)};
  }
  if(!renderer)return null;
  let tile=tiles[pool];
  if(!tile?.fieldActive||tile.fieldImage!==image)tile=tiles.slice(sphereCount).filter(tile=>tile.fieldActive&&tile.fieldImage===image&&tile.mesh.visible&&tile.fieldOpacity>.12).sort((a,b)=>b.mesh.position.z-a.mesh.position.z)[0];
  if(!tile)return null;
  const rect=renderer.domElement.getBoundingClientRect();
  const quad=[[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>{
    const p=new THREE.Vector3(x,y,0).applyMatrix4(tile.mesh.matrixWorld).project(camera);
    return {x:rect.x+(p.x+1)*rect.width/2,y:rect.y+(1-p.y)*rect.height/2};
  });
  return {quad,element:null};
}

function pauseForViewer(){
  if(state.phase==='sphere')domeApi?.freeze();else domeApi?.pause();
  stopFlight(flight);
  state.velocityX=state.velocityY=0;
  state.targetPanX=state.panX;state.targetPanY=state.panY;
  const drift=8*clamp((state.distance+state.fieldOriginZ-ENTRY_Z+50)/50,.3,2);
  state.pointerX=state.driftX/drift;state.pointerY=state.driftY/drift;
  pointers.clear();dragging=false;renderer?.domElement.classList.remove('dragging');
  cancelAnimationFrame(frame);frame=0;
  shell.inert=true;shell.dataset.viewer='open';
}

function resumeFromViewer(){
  shell.inert=false;shell.dataset.viewer='closed';
  if(state.phase==='sphere')domeApi?.resume();
  if(pendingViewerResize){pendingViewerResize=false;resize();}
}

function showPhoto(image = state.selectedImage,pool=state.selectedPool) {
  if(image<0||state.phase==='transition')return;
  void viewer.open(image,pool);
}

function showNotice(text){el('hint').textContent=text;el('hint').classList.remove('sr-only');}

function wireControls() {
  el('zoom-in').addEventListener('click', () => zoomBy(-300));
  el('zoom-out').addEventListener('click', () => zoomBy(300));
  el('return').addEventListener('click', () => progressTo(0));
  el('enter').addEventListener('click', () => progressTo(state.phase === 'space' ? 0 : 1));
  el('journey').addEventListener('input', e => progressTo(Number(e.target.value) / 100));
  el('view-photo').addEventListener('click', () => showPhoto());
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !viewer?.isOpen && state.phase !== 'sphere') { progressTo(0); } });
}

function fallback() {
  el('loading').hidden = true;
  if(domeApi){
    el('fallback').hidden=true;
    shell.dataset.view='sphere';shell.dataset.layout='react-bits-dome';shell.dataset.imageFit='contain';shell.dataset.renderer='css-only';
    el('mode').textContent='图片浏览';showNotice('当前无法进入影像空间，可拖动旋转并查看照片。');
    el('enter').disabled=el('zoom-in').disabled=el('zoom-out').disabled=el('journey').disabled=true;
    return;
  }
  el('fallback').hidden = false;
  el('mode').textContent = '图片浏览';
  showNotice('当前无法开启三维空间，可点击查看完整照片。');
  el('enter').disabled = el('zoom-in').disabled = el('zoom-out').disabled = true;
  el('journey').disabled = true;
  for (const [index, photo] of photos.entries()) {
    const button = document.createElement('button');
    const img = document.createElement('img');
    img.src = photo.image; img.alt = photo.title; img.loading = 'lazy';
    button.append(img); button.setAttribute('aria-label', `查看${photo.title}`);
    button.addEventListener('click', () => showPhoto(index));
    el('fallback-photos').append(button);
  }
}

function dispose() {
  if (disposed) return;
  disposed = true;
  viewer?.dispose();
  sideWall?.dispose();starfield?.dispose();
  domeApi?.dispose();domeApi?.unmount();
  detailEpoch++;detailTexture?.dispose();
  cancelAnimationFrame(frame); frame = 0;
  for (const texture of textures) texture.dispose();
  for (const tile of tiles) tile.material?.dispose();
  geometry?.dispose(); renderer?.dispose();
}

async function init() {
  shell.dataset.reduced = String(reduceMotion());
  const response = await fetch('./manifest.json');
  if (!response.ok) throw new Error('图片样本尚未准备');
  photos = await response.json();
  viewer=createSingleViewer({photos,getOrigin:photoOrigin,beforeOpen:pauseForViewer,afterClose:resumeFromViewer,reduceMotion,
    onError:()=>showNotice('大图未能打开，请再试一次。')});
  el('load-progress').max = photos.length;
  wireControls();
  stage.dataset.photos=String(photos.length);
  domeApi=await mountDome(domeHost,photos,{
    onMotion:()=>{if(viewer?.isOpen)return;if(domeApi){const radius=domeApi.radius;if(sideWall?.radius!==radius)sideWall?.resize(radius);sideWall?.rotate(domeApi.rotation);if(ready){if(overviewProjection!==2*radius)resize();schedule();}}},
    onOpenImage:(pool,src)=>showPhoto(Math.max(0,photos.findIndex(photo=>photo.image===src)),pool),
    onSelect:(pool,src)=>{
      if(tiles[pool])setSelection(pool);
      else{state.selectedPool=pool;state.selectedImage=Math.max(0,photos.findIndex(photo=>photo.image===src));el('selection').textContent=photos[state.selectedImage].title;el('view-photo').disabled=false;}
    }
  },reduceMotion());
  sideWall=createSideWall(domeHost.querySelector('.sphere-main'),photos,domeApi.radius);sideWall.rotate(domeApi.rotation);
  domeHost.addEventListener('wheel',e=>{e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;zoomBy(clamp(e.deltaY*unit,-500,500));},{passive:false});
  domeHost.addEventListener('keydown',e=>{if(e.defaultPrevented)return;if(e.key==='Enter'){e.preventDefault();progressTo(1);}if(e.key==='+'||e.key==='='){e.preventDefault();zoomBy(-250);}if(e.key==='-'){e.preventDefault();zoomBy(250);}});
  reduced.addEventListener('change',()=>{domeApi.setReduced(reduceMotion());stopFlight(flight);state.velocityX=state.velocityY=0;state.driftX=state.driftY=0;shell.dataset.reduced=String(reduceMotion());schedule();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){domeApi.pause();stopFlight(flight);cancelAnimationFrame(frame);frame=0;pointers.clear();state.velocityX=state.velocityY=0;renderer?.domElement.classList.remove('dragging');}
    else{lastTime=performance.now();schedule();}
  });
  window.addEventListener('pagehide',event=>{if(event.persisted){domeApi.pause();stopFlight(flight);cancelAnimationFrame(frame);frame=0;}else dispose();});
  window.addEventListener('pageshow',event=>{if(event.persisted){lastTime=performance.now();schedule();}});
  try { if(new URL(location.href).searchParams.get('render')==='css')throw new Error('CSS-only validation');renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch { fallback(); return; }
  renderer.setClearColor(0x000000);
  starfield=createStarfield(scene);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);
  const loader = new THREE.TextureLoader();
  let loaded = 0;
  await Promise.all(photos.map(async (photo, index) => {
    const texture = await loader.loadAsync(photo.image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures[index] = texture;
    loaded++;
    el('load-progress').value = loaded;
    el('loading-text').textContent = `正在展开照片 ${loaded} / ${photos.length}`;
  }));
  stage.dataset.photos = String(photos.length);
  wireCanvas();
  // Upload a small batch per frame and compile while the loading state is visible.
  // The first wheel gesture then uses prepared textures/programs instead of stalling.
  el('loading-text').textContent='正在准备影像空间';
  resize();
  const warmTile=addTile(0);warmTile.mesh.visible=false;
  await renderer.compileAsync(scene,camera);
  for(let index=0;index<textures.length;index+=3){
    await new Promise(resolve=>requestAnimationFrame(resolve));
    if(disposed)return;
    for(const texture of textures.slice(index,index+3))renderer.initTexture(texture);
  }
  ready = true;
  resize();
  el('loading').hidden = true;
  new ResizeObserver(resize).observe(stage);
}

init().catch(error => {
  console.error(error);
  el('loading-text').textContent = '照片未能载入，请重试';
  const retry = document.createElement('button');
  retry.textContent = '重新载入';
  retry.addEventListener('click', () => location.reload());
  el('loading').append(retry);
});
