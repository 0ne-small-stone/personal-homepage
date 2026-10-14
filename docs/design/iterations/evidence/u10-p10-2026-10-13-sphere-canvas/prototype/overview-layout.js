import * as THREE from 'three';

// Original aspect-aware layout. Dome Gallery is a composition reference only;
// no React Bits component code, fixed crop frames or motion stretch is used.
const UP = new THREE.Vector3(0, 1, 0);
const ZERO = new THREE.Vector3();
const orient = new THREE.Matrix4();

export function overviewLayout(photos, radius, layoutAspect=1) {
  const items = [];
  const columns = 24;
  const step = Math.PI * 2 / columns;
  const limit = THREE.MathUtils.degToRad(56);
  const gap = .026;
  function add(image, longitude, latitude, width) {
    const base = new THREE.Vector3(Math.sin(longitude)*Math.cos(latitude), Math.sin(latitude), Math.cos(longitude)*Math.cos(latitude)).multiplyScalar(radius);
    // A fixed local frame is transported by the user's quaternion. It never
    // reconstructs its up vector at a pole, so crossing a pole cannot flip it.
    const up = Math.abs(latitude)>Math.PI/2-.001 ? new THREE.Vector3(0,0,-Math.sign(latitude)) : UP;
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(orient.lookAt(base,ZERO,up));
    items.push({ image, base, quaternion, longitude, latitude, size:new THREE.Vector2(width,width/(photos[image].width/photos[image].height)) });
  }
  for(let column=0;column<columns;column++) {
    const longitude=column*step;
    let bottom=-limit+(column%2?.085:.01);
    let row=0;
    while(bottom<limit) {
      const image=(column*7+row*13)%photos.length;
      const aspect=photos[image].width/photos[image].height;
      let latitude=bottom;
      let height=0;
      for(let iteration=0;iteration<5;iteration++) {
        height=step*Math.cos(latitude)*.92*layoutAspect/aspect;
        latitude=bottom+height/2;
      }
      if(latitude+height/2>limit+.045) break;
      add(image,longitude,latitude,step*Math.cos(latitude)*.92*radius);
      items.at(-1).cellAspect=layoutAspect;
      bottom=latitude+height/2+gap;
      row++;
    }
  }
  // Two complete polar patches make unrestricted vertical rotation useful.
  const landscape=photos.map((photo,image)=>({photo,image})).filter(({photo})=>photo.width>=photo.height).map(({image})=>image);
  for(const sign of [-1,1]) {
    for(let i=0;i<8;i++) add(landscape[(i+(sign>0?5:0))%landscape.length]??i%photos.length,i*Math.PI/4,sign*THREE.MathUtils.degToRad(68),1.55);
    add(sign>0?20%photos.length:8%photos.length,0,sign*Math.PI/2,2.2);
  }
  return items;
}

export function overviewPose(tile, rotation, radii, radius, position, quaternion) {
  const unit=tile.base.clone().divideScalar(radius).applyQuaternion(rotation);
  const normal=unit.clone().divide(radii).normalize();
  const right=new THREE.Vector3(1,0,0).applyQuaternion(tile.sphereQuat).applyQuaternion(rotation).multiply(radii).divideScalar(radius);
  const localUp=new THREE.Vector3(0,1,0).applyQuaternion(tile.sphereQuat).applyQuaternion(rotation).multiply(radii).divideScalar(radius);
  const widthMetric=right.length();
  right.normalize();
  const up=new THREE.Vector3().crossVectors(normal,right).normalize();
  tile.overviewScale=Math.min(widthMetric,(tile.cellAspect??1)*Math.abs(localUp.dot(up)));
  position.copy(unit).multiply(radii);
  quaternion.setFromRotationMatrix(orient.makeBasis(right,up,normal));
}
