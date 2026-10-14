import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix3, Matrix4, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { motionRange, workCount } from '../src/components/home/motion-ranges.ts';
import { portalContainsPoint, portalCoversViewport, portalQuadAt, portalStartQuad, portalUvProjection, portalWallY } from '../src/components/home/wall-portal-geometry.ts';
import GlassPortalShape from '../src/components/home/GlassPortalShape.ts';
import { makeTriangleGeometry } from '../src/components/home/prism-geometry.ts';
import { assemblyLayout, brickLanding, brickRiseDistance, brickState, brickTiming, openingCoordinate, wallBrick, wallBuild, wallReadingReady, wallView } from '../src/components/home/wall-assembly.ts';

test('F02 ranges meet after the three-card track without a removed carousel slot', () => {
  const height = 900;
  assert.deepEqual(motionRange('outro', height), [3700, 5050]);
  assert.deepEqual(motionRange('prepare', height), [5050, 5950]);
  assert.deepEqual(motionRange('expand', height), [5950, 8650]);
  assert.deepEqual(motionRange('wall', height), [8650, 10450]);
  assert.deepEqual(motionRange('works', height), [1000, 4600]);
  assert.deepEqual(motionRange('prepare', 390), [2245, 2635]);
  assert.deepEqual(motionRange('expand', 390), [2635, 3805]);
  assert.deepEqual(motionRange('wall', 390), [3805, 4585]);
  assert.equal(workCount, 3);
});

test('F02 full-screen gate uses actual two-triangle viewport coverage', () => {
  const source = [new Vector2(.5, .72), new Vector2(.34, .3), new Vector2(.66, .3), new Vector2(.66, .3)];
  assert.equal(portalCoversViewport(portalQuadAt(source, 0)), false);
  assert.equal(portalCoversViewport(portalQuadAt(source, .7)), false);
  assert.equal(portalCoversViewport(portalQuadAt(source, 1)), true);
  const full = portalQuadAt(source, 1);
  for (let x = 0; x <= 1; x += .05) for (let y = 0; y <= 1; y += .05) {
    assert.equal(portalContainsPoint(full, new Vector2(x, y)), true, `coverage hole at ${x},${y}`);
  }
});

test('assembled wall always stays at its final reading coordinates', () => {
  assert.equal(portalWallY(0), 0);
  assert.equal(portalWallY(1), 0);
  assert.equal(portalWallY(.5), 0);
});

test('square milestone has equal CSS sides on desktop and phone, and C1 joins',()=>{
  const source=portalStartQuad(new Vector2(.5,.72),new Vector2(.34,.3),new Vector2(.66,.3));
  for(const [width,height] of [[1280,720],[390,844]]) {
    const quad=portalQuadAt(source,.42,width,height);
    const x=(quad[3].x-quad[0].x)*width,y=(quad[0].y-quad[1].y)*height;
    assert.ok(Math.abs(x/y-1)<1e-10);
    assert.ok(Math.abs(x-Math.min(width,height)*.64)<1e-8);
    assert.equal(portalCoversViewport(portalQuadAt(source,1,width,height)),true);
  }
  const d=1e-5,at=openingCoordinate(.2,.3,1.04,.42);
  const before=(at-openingCoordinate(.2,.3,1.04,.42-d))/d;
  const after=(openingCoordinate(.2,.3,1.04,.42+d)-at)/d;
  assert.ok(Math.abs(before-after)<.001);
});

test('brick sequence starts after the square, rises from its foundation and is entirely reversible',()=>{
  const layout=assemblyLayout(4.27,2.4);
  assert.equal(wallBuild(.419,0),0);assert.equal(wallBuild(.42,0),0);
  assert.ok(wallBuild(1,0)<1);assert.equal(wallBuild(1,.76),1);
  const row=layout.minRow,column=11;
  const sequence=[0,.08,.2,.5,1,.5,.2,.08,0].map(build=>brickState(build,row,column,layout));
  for(let i=0;i<4;i++)assert.deepEqual(sequence[i],sequence[8-i]);
  assert.equal(sequence[0].visible,false);
  const timing=brickTiming(row,column,layout);
  assert.ok(brickState(timing.start+timing.duration*.25,row,column,layout).y<
    brickState(timing.start+timing.duration*.75,row,column,layout).y);
  assert.deepEqual({x:sequence[4].x,y:sequence[4].y},brickLanding(row,column));
  for(let r=layout.minRow;r<=layout.maxRow;r++)for(let c=layout.minColumn;c<=layout.maxColumn;c++) {
    const landed=brickState(1,r,c,layout);
    assert.equal(landed.progress,1);assert.equal(landed.visible,true);
    assert.deepEqual({x:landed.x,y:landed.y},brickLanding(r,c));
    const phase=brickTiming(r,c,layout);
    for(const progress of [0,.25,.5,.75,1]) {
      const state=brickState(phase.start+phase.duration*progress,r,c,layout);
      assert.ok(state.y<=landed.y+1e-9,'brick entered from above its final position');
      assert.ok(state.y>=landed.y-brickRiseDistance-1e-9,'brick travelled through the empty space');
    }
  }
  const lower=brickState(.2,row,column,layout),upper=brickState(.2,row+2,column,layout);
  assert.ok(lower.progress>=upper.progress);
});

test('wall view is one uniform scale, ends at identity and reading needs both coverage and assembly',()=>{
  assert.deepEqual(wallView(1,-.04),{scale:1,bottom:0});
  assert.equal(wallReadingReady(1,1,false),false);
  assert.equal(wallReadingReady(.75,1,true),false);
  assert.equal(wallReadingReady(1,0,true),false);
  assert.equal(wallReadingReady(1,.76,true),true);
});

test('individual brick timing breaks row cohorts while preserving each column foundation',()=>{
  for(const [width,height] of [[4.27,2.4],[2.4,5.2],[3,3]]) {
    const layout=assemblyLayout(width,height),row=layout.minRow;
    const timings=[];
    for(let column=layout.minColumn;column<=layout.maxColumn;column++) {
      const timing=brickTiming(row,column,layout);timings.push(timing);
      for(let r=row;r<layout.maxRow;r++) {
        const lower=brickTiming(r,column,layout),upper=brickTiming(r+1,column,layout);
        assert.ok(lower.start+lower.duration<upper.start,'upper brick started before its column base settled');
      }
    }
    const spread=Math.max(...timings.map(t=>t.start))-Math.min(...timings.map(t=>t.start));
    assert.ok(spread>2/(layout.rows+4),'row still rises as one cohort');
    assert.ok(new Set(timings.map(t=>t.duration)).size>=4,'one shared rise duration');
    const fronts=[];
    for(let column=layout.minColumn;column<=layout.maxColumn;column++) {
      let highest=row-1;
      for(let r=row;r<=layout.maxRow;r++)if(brickState(.45,r,column,layout).progress===1)highest=r;
      fronts.push(highest);
    }
    assert.ok(Math.max(...fronts)-Math.min(...fronts)>=2,'flat horizontal assembly front');
  }
});

test('art-directed approach stays restrained, reversible and restores exact final pose',()=>{
  const layout=assemblyLayout(4.27,2.4),row=layout.minRow,column=11;
  const timing=brickTiming(row,column,layout);
  const pose=brickState(timing.start+timing.duration*.5,row,column,layout);
  assert.ok(Math.abs(pose.x-brickLanding(row,column).x)<=.08);
  assert.ok(pose.tiltX>0&&pose.tiltX<=.14&&Math.abs(pose.tiltY)<=.08);
  assert.ok(pose.reveal>0&&pose.reveal<1);
  const landed=brickState(1,row,column,layout);
  assert.equal(landed.tiltX,0);assert.equal(landed.tiltY,0);assert.equal(landed.z,0);assert.equal(landed.reveal,1);
  assert.deepEqual(pose,brickState(timing.start+timing.duration*.5,row,column,layout));
});

test('compact wall draw set retains every viewport corner without all 897 bricks',()=>{
  for(const [width,height] of [[4.27,2.4],[2.4,5.2],[2.4,5.6]]) {
    const layout=assemblyLayout(width,height),points=[];
    for(let r=layout.minRow;r<=layout.maxRow;r++)for(let c=layout.minColumn;c<=layout.maxColumn;c++)points.push(brickLanding(r,c));
    assert.ok(points.length<200);
    for(const x of [-width,width])for(const y of [-height,height]) {
      assert.ok(points.some(p=>Math.abs(p.x-x)<=wallBrick.stepX/2&&Math.abs(p.y-y)<=wallBrick.stepY/2),'viewport corner lost from compact instance set');
    }
  }
});

test('one homogeneous map covers the rounded start, intermediate quad, and full viewport without a diagonal seam', () => {
  const source = portalStartQuad(new Vector2(.5,.72),new Vector2(.34,.3),new Vector2(.66,.3));
  const expected = [[0,1],[0,0],[1,0],[1,1]];
  for (const progress of [0,.001,.275,.5,.75,1]) {
    const quad = portalQuadAt(source,progress), projection = portalUvProjection(quad);
    assert.ok(projection, `degenerate transform at ${progress}`);
    quad.forEach((p,i)=>{
      const uv = new Vector3(p.x,p.y,1).applyMatrix3(projection);
      assert.ok(Math.abs(uv.x/uv.z-expected[i][0])<1e-6);
      assert.ok(Math.abs(uv.y/uv.z-expected[i][1])<1e-6);
    });
    const weight=progress*progress*(3-2*progress), identity=new Matrix3();
    const mixed=projection.clone(); mixed.elements.forEach((_,i)=>mixed.elements[i]=(1-weight)*projection.elements[i]+weight*identity.elements[i]);
    const inverse=mixed.invert();
    const line=[.15,.45,.8].map(u=>{const p=new Vector3(u,.4,1).applyMatrix3(inverse);return new Vector2(p.x/p.z,p.y/p.z);});
    const ab=line[1].clone().sub(line[0]),ac=line[2].clone().sub(line[0]);
    assert.ok(Math.abs(ab.x*ac.y-ab.y*ac.x)<1e-7,'brick row bends across the face');
  }
});

test('glass front, bevel and back deform together and restore the exact F01 geometry', () => {
  const geometry=makeTriangleGeometry(), original=new Float32Array(geometry.getAttribute('position').array);
  const shape=new GlassPortalShape(geometry), camera=new PerspectiveCamera(45,1280/720,.1,50);
  camera.position.set(0,0,6);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
  const world=new Matrix4().makeScale(.5,.5,.5);
  shape.update(camera,world,0);
  assert.deepEqual(geometry.getAttribute('position').array,original);
  for(const progress of [.275,.75,1]) {
    shape.update(camera,world,progress);
    assert.ok(geometry.getAttribute('position').array.every(Number.isFinite));
    assert.ok(shape.quad.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
    assert.ok(geometry.boundingBox.max.x-geometry.boundingBox.min.x>3.35);
    if(progress===.75) {
      assert.equal(shape.frontCoversCorners,false);
      const position=geometry.getAttribute('position');
      for(let i=0;i<position.count;i++){
        const p=new Vector3().fromBufferAttribute(position,i).applyMatrix4(world).project(camera);
        assert.ok(Math.abs(p.x)<1.1 && Math.abs(p.y)<1.1,'bevel extrapolated beyond the opening domain');
      }
    }
  }
  shape.update(camera,world,.99);
  assert.equal(shape.frontCoversCorners,true);
  shape.update(camera,world,0);
  assert.deepEqual(geometry.getAttribute('position').array,original);
  geometry.dispose();
});
