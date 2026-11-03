import {MathUtils} from 'three';
// CameraRig authors a blended projection, including while the pose is frozen.
// R3F must not replace it with its default perspective projection on resize.
export function claimCameraProjection(camera) {
  const hadManual=Object.prototype.hasOwnProperty.call(camera,'manual'),manual=camera.manual,layers=camera.layers.mask;
  camera.manual=true;camera.layers.enable(1);camera.layers.enable(2);
  let active=true;
  return()=>{
    if(!active)return;active=false;
    camera.layers.mask=layers;
    if(hadManual)camera.manual=manual;else delete camera.manual;
  };
}

// The same authored projection in both moving and frozen frames. A resize
// changes the viewport, not the frozen pose, zoom or blend progress.
export function writeJourneyProjection(camera,perspective,orthographic,width,height,zoom,projection,unit) {
  const aspect=width/height;camera.aspect=aspect;
  camera.fov=35+18/aspect-4*zoom;camera.updateProjectionMatrix();
  perspective.copy(camera.projectionMatrix);
  const x=4*unit*Math.max(1,aspect),y=4*unit/Math.min(1,aspect);
  orthographic.makeOrthographic(-x,x,y,-y,camera.near,camera.far,camera.coordinateSystem);
  for(let i=0;i<16;i++)camera.projectionMatrix.elements[i]=MathUtils.lerp(perspective.elements[i],orthographic.elements[i],projection);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
