import { ExtrudeGeometry, Shape, Vector2, Vector3 } from 'three';

function roundedTriangle(points: Vector2[], radius: number, target: Shape) {
  const entries = points.map((v, i) => v.clone().lerp(points[(i + points.length - 1) % points.length], radius));
  const exits = points.map((v, i) => v.clone().lerp(points[(i + 1) % points.length], radius));
  target.moveTo(entries[0].x, entries[0].y);
  points.forEach((v, i) => {
    if (i) target.lineTo(entries[i].x, entries[i].y);
    target.quadraticCurveTo(v.x, v.y, exits[i].x, exits[i].y);
  });
  target.lineTo(entries[0].x, entries[0].y);
  target.closePath();
}

export function makeTriangleGeometry() {
  // SYSTEM 9.3.10: solid prism, retaining the calibrated outer rounding and depth.
  // Final local W/H/D = 3.353368 / 2.913569 / .820492.
  const vertices = (width: number, height: number, y = 0) => [
    new Vector2(0, height * 2 / 3 + y),
    new Vector2(-width / 2, -height / 3 + y),
    new Vector2(width / 2, -height / 3 + y),
  ];
  const shape = new Shape();
  const corners = vertices(3.382356834, 2.914426843);
  roundedTriangle(corners, .035, shape);
  const geometry = new ExtrudeGeometry(shape, { depth: .770491776, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 4, curveSegments: 16, steps: 1 });
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const center = geometry.boundingBox!.getCenter(new Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.computeBoundingBox();
  geometry.userData.lsshPrismCorners = corners.map(p => new Vector3(p.x-center.x,p.y-center.y,geometry.boundingBox!.max.z));
  return geometry;
}
