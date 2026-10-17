/*! Infinite Canvas region generation adapted from Edoardo Lunardi / Codrops.
 * Copyright (c) 2009 - 2025 Codrops. MIT; see INFINITE-CANVAS-LICENSE.txt.
 * Source: github.com/edoardolunardi/infinite-canvas, src/infinite-canvas/utils.ts
 * Adaptation: plain data, bounded view candidates, local image manifest, anchor.
 */
export const CHUNK_SIZE = 110;
export const FADE_START = 140;
export const FADE_END = 260;
export const PHOTO_SIZE_SCALE = 1.25;
export const ENTRY_PHOTO_HEIGHT = 14 * PHOTO_SIZE_SCALE;
const seededRandom = seed => { const x = Math.sin(seed * 9999) * 10000; return x - Math.floor(x); };
const hashString = str => { let h = 0; for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0; return Math.abs(h); };

export function chunkPlanes(cx, cy, cz) {
  const seed = hashString(`${cx},${cy},${cz}`);
  return Array.from({length: 5}, (_, i) => {
    const r = n => seededRandom(seed + i * 1000 + n);
    return { key: `${cx},${cy},${cz}:${i}`, x: cx * CHUNK_SIZE + r(0) * CHUNK_SIZE, y: cy * CHUNK_SIZE + r(1) * CHUNK_SIZE, z: cz * CHUNK_SIZE + r(2) * CHUNK_SIZE, height: (12 + r(4) * 8) * PHOTO_SIZE_SCALE, media: Math.floor(r(5) * 1000000) };
  });
}

export function projectFieldFrame(plane,camera,aspect,imageAspect=1){
  const depth=camera.z-plane.z,tangent=Math.tan(Math.PI/6);
  const halfHeight=plane.height*1.04/(2*depth*tangent),halfWidth=halfHeight*imageAspect/aspect;
  const x=(plane.x-camera.x)/(depth*tangent*aspect),y=(plane.y-camera.y)/(depth*tangent);
  return {left:Math.max(-1,x-halfWidth),right:Math.min(1,x+halfWidth),bottom:Math.max(-1,y-halfHeight),top:Math.min(1,y+halfHeight)};
}

export function fieldCandidates(camera, aspect, anchorImage, imageAspect=()=>1,getChunk=chunkPlanes,photoCount=0) {
  const center = [camera.x, camera.y, camera.z].map(v => Math.floor(v / CHUNK_SIZE));
  const planes = [];
  const tangent = Math.tan(Math.PI / 6);
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) {
    for (const plane of getChunk(center[0] + dx, center[1] + dy, center[2] + dz)) {
      const depth = camera.z - plane.z;
      // A generous margin retains planes until well outside the viewport.
      if (depth < 3 || depth > FADE_END) continue;
      const halfHeight = Math.max(14, plane.height * 1.5);
      if (Math.abs(plane.x - camera.x) > depth * tangent * aspect + halfHeight + 35 || Math.abs(plane.y - camera.y) > depth * tangent + halfHeight + 35) continue;
      // Keep the selected entry photograph legible; other regions remain untouched.
      if (Math.abs(plane.x) < 20 && Math.abs(plane.y) < 16 && Math.abs(plane.z) < 22) continue;
      plane.score = Math.hypot(plane.x - camera.x, plane.y - camera.y) / Math.max(20, depth) + depth / 500;
      planes.push(plane);
    }
  }
  if (camera.z > 2 && camera.z < FADE_END && Math.abs(camera.x) < camera.z * tangent * aspect + 50 && Math.abs(camera.y) < camera.z * tangent + 50) {
    planes.push({key:'anchor',x:0,y:0,z:0,height:ENTRY_PHOTO_HEIGHT,media:anchorImage,score:-1});
  }
  const accepted=[],frames=[],usedPhotos=new Set(),gapY=.04,gapX=gapY/aspect;
  // Keep the original world positions. Only suppress projected collisions.
  for(const plane of planes.sort((a,b)=>(a.key==='anchor'?-1:b.key==='anchor'?1:(camera.z-a.z)-(camera.z-b.z))||a.score-b.score||a.key.localeCompare(b.key))){
    const photo=plane.key==='anchor'?anchorImage:plane.media%photoCount;
    if(photoCount&&usedPhotos.has(photo))continue;
    const frame=projectFieldFrame(plane,camera,aspect,imageAspect(plane));
    if(frame.left>=frame.right||frame.bottom>=frame.top)continue;
    if(frames.some(other=>frame.left<other.right+gapX&&frame.right>other.left-gapX&&frame.bottom<other.top+gapY&&frame.top>other.bottom-gapY))continue;
    accepted.push(plane);frames.push(frame);usedPhotos.add(photo);if(accepted.length>=96)break;
  }
  return accepted;
}

// Keep only the current 7×7×7 region window; crossing a chunk retains its neighbours.
export function createFieldQuery(){
  const chunks=new Map();let currentCenter='';
  return (camera,aspect,anchorImage,imageAspect,photoCount)=>{
    const center=[camera.x,camera.y,camera.z].map(v=>Math.floor(v/CHUNK_SIZE));
    const key=center.join(',');
    if(key!==currentCenter){
      const wanted=new Set();
      for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)for(let dz=-3;dz<=3;dz++){
        const coords=[center[0]+dx,center[1]+dy,center[2]+dz],id=coords.join(',');wanted.add(id);
        if(!chunks.has(id))chunks.set(id,chunkPlanes(...coords));
      }
      for(const id of chunks.keys())if(!wanted.has(id))chunks.delete(id);
      currentCenter=key;
    }
    return fieldCandidates(camera,aspect,anchorImage,imageAspect,(x,y,z)=>chunks.get(`${x},${y},${z}`),photoCount);
  };
}
