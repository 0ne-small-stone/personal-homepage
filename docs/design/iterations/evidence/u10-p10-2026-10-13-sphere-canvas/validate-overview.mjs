import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import { overviewLayout, overviewPose } from './prototype/overview-layout.js';

const photos=JSON.parse(await fs.readFile('.local-tools/sphere-canvas/site/manifest.json','utf8'));
const radius=6.2;
const report={viewports:[],poseSamples:0,maxAspectError:0,maxFrameStep:0,maxSurfaceError:0};
for(const [width,height,top,bottom,margin] of [[1280,720,95,160,120],[390,844,125,230,56],[844,390,72,104,120]]) {
  const aspect=THREE.MathUtils.clamp(Math.sqrt((width-margin)/Math.max(190,height-top-bottom)),.65,1.9);
  const radii=new THREE.Vector3(radius*Math.sqrt(aspect),radius/Math.sqrt(aspect),radius);
  const items=overviewLayout(photos,radius,aspect);
  const tiles=items.map(item=>({base:item.base,sphereQuat:item.quaternion,cellAspect:item.cellAspect??1,baseSize:item.size,image:item.image}));
  assert.equal(new Set(items.map(item=>item.image)).size,photos.length,'All sample images must remain represented.');
  assert.ok(items.some(item=>item.latitude===Math.PI/2)&&items.some(item=>item.latitude===-Math.PI/2),'Both poles need photos.');
  report.viewports.push({width,height,aspect,photos:items.length});
  for(const axis of [new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0)]) {
    const previous=tiles.map(()=>null);
    for(let degree=0;degree<=360;degree+=2) {
      const rotation=new THREE.Quaternion().setFromAxisAngle(axis,THREE.MathUtils.degToRad(degree));
      for(const [index,tile] of tiles.entries()) {
        const position=new THREE.Vector3(),frame=new THREE.Quaternion();
        overviewPose(tile,rotation,radii,radius,position,frame);
        const size=tile.baseSize.clone().multiplyScalar(tile.overviewScale);
        const aspectError=Math.abs(size.x/size.y/(photos[tile.image].width/photos[tile.image].height)-1);
        const surfaceError=Math.abs(position.clone().divide(radii).length()-1);
        report.maxAspectError=Math.max(report.maxAspectError,aspectError);
        report.maxSurfaceError=Math.max(report.maxSurfaceError,surfaceError);
        assert.ok(Number.isFinite(tile.overviewScale)&&tile.overviewScale>0);
        assert.ok(aspectError<1e-12&&surfaceError<1e-12);
        assert.ok(Math.abs(frame.length()-1)<1e-12,'Orientation must remain a proper rotation.');
        if(previous[index]) {
          const angle=previous[index].angleTo(frame);
          report.maxFrameStep=Math.max(report.maxFrameStep,angle);
          assert.ok(angle<.13,'A two-degree input must not create a pole flip.');
        }
        previous[index]=frame;
        report.poseSamples++;
      }
    }
  }
}
await fs.writeFile(new URL('./overview-geometry-qa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
