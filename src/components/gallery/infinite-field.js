/*! Infinite Canvas region generation adapted from Edoardo Lunardi / Codrops.
 * Copyright (c) 2009 - 2025 Codrops. MIT; see INFINITE-CANVAS-LICENSE.txt.
 * Source: github.com/edoardolunardi/infinite-canvas, src/infinite-canvas/utils.ts
 * Adaptation: plain data, bounded view candidates, local image manifest, anchor.
 */
export const CHUNK_SIZE = 110;
export const FADE_START = 140;
export const FADE_END = 260;
export const FAR_ENTRY_DEPTH = 220;
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

export function fieldCandidates(camera, aspect, anchorImage, imageAspect=()=>1,getChunk=chunkPlanes,photoCount=0,policy={}) {
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
  // Residents win over newcomers, so a newly uncovered neighbour cannot evict
  // an already visible photograph or take over its repeated-media identity.
  for(const plane of planes.sort((a,b)=>(a.key==='anchor'?-1:b.key==='anchor'?1:0)||Number(policy.retained?.has(b.key)??false)-Number(policy.retained?.has(a.key)??false)||(camera.z-a.z)-(camera.z-b.z)||a.score-b.score||a.key.localeCompare(b.key))){
    const photo=plane.key==='anchor'?anchorImage:plane.media%photoCount;
    if(photoCount&&usedPhotos.has(photo))continue;
    const frame=projectFieldFrame(plane,camera,aspect,imageAspect(plane));
    if(frame.left>=frame.right||frame.bottom>=frame.top)continue;
    if(policy.admit&&!policy.admit(plane,frame))continue;
    if(frames.some(other=>frame.left<other.right+gapX&&frame.right>other.left-gapX&&frame.bottom<other.top+gapY&&frame.top>other.bottom-gapY))continue;
    accepted.push(plane);frames.push(frame);usedPhotos.add(photo);if(accepted.length>=96)break;
  }
  return accepted;
}

// Keep only the current 7×7×7 region window; crossing a chunk retains its neighbours.
export function createFieldQuery(){
  const chunks=new Map(),seen=new Set();let currentCenter='',retained=new Set(),previousCamera,previousAspect;
  const query=(camera,aspect,anchorImage,imageAspect,photoCount,options)=>{
    const center=[camera.x,camera.y,camera.z].map(v=>Math.floor(v/CHUNK_SIZE));
    const key=center.join(',');
    if(key!==currentCenter){
      const wanted=new Set();
      for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)for(let dz=-3;dz<=3;dz++){
        const coords=[center[0]+dx,center[1]+dy,center[2]+dz],id=coords.join(',');wanted.add(id);
        if(!chunks.has(id))chunks.set(id,chunkPlanes(...coords));
      }
      for(const id of chunks.keys())if(!wanted.has(id))chunks.delete(id);
      for(const id of seen)if(id!=='anchor'&&!wanted.has(id.split(':')[0]))seen.delete(id);
      currentCenter=key;
    }
    const getChunk=(x,y,z)=>chunks.get(`${x},${y},${z}`);
    if(!options)return fieldCandidates(camera,aspect,anchorImage,imageAspect,getChunk,photoCount);
    const seeding=options.seed||!previousCamera;
    const resizing=previousAspect!==undefined&&previousAspect!==aspect;
    const dx=previousCamera?camera.x-previousCamera.x:0,dy=previousCamera?camera.y-previousCamera.y:0,dz=previousCamera?camera.z-previousCamera.z:0;
    const edgeMotion=dz>.00001||(Math.hypot(dx,dy)>.001&&Math.hypot(dx,dy)>Math.abs(dz)*.05);
    const reasons=new Map();
    const result=fieldCandidates(camera,aspect,anchorImage,imageAspect,getChunk,photoCount,{
      retained,
      admit(plane,frame){
        if(retained.has(plane.key))return true;
        const depth=camera.z-plane.z;
        // A lateral entry must be confined to a viewport sliver. A giant
        // central near plane touching every edge is deliberately not an edge entry.
        const edge=edgeMotion&&(frame.left>=.85||frame.right<=-.85||frame.bottom>=.85||frame.top<=-.85);
        const reason=seeding?'initial':resizing?'resize':plane.key==='anchor'?'anchor':depth>=FAR_ENTRY_DEPTH?'far':edge?'edge':null;
        if(!reason)return false;
        reasons.set(plane.key,reason);return true;
      }
    });
    for(const plane of result){
      if(!retained.has(plane.key))options.onAdmission?.({key:plane.key,photo:plane.key==='anchor'?anchorImage:plane.media%photoCount,depth:camera.z-plane.z,reason:reasons.get(plane.key),first:!seen.has(plane.key)});
      seen.add(plane.key);
    }
    retained=new Set(result.map(plane=>plane.key));previousCamera={...camera};previousAspect=aspect;
    return result;
  };
  query.reset=()=>{seen.clear();retained.clear();previousCamera=previousAspect=undefined;};
  query.inspect=()=>({chunks:chunks.size,residents:retained.size,history:seen.size});
  return query;
}
