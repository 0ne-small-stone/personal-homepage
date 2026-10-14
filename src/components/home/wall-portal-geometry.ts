import { Matrix3, Vector2 } from 'three';
import { openingCoordinate, squareShortSide } from './wall-assembly.ts';

export type PortalQuad = [Vector2, Vector2, Vector2, Vector2];
export const portalCornerCut = .045;

/** The rounded right corner has a short fourth edge, never a zero-area UV face. */
export function portalStartQuad(a: Vector2, b: Vector2, c: Vector2): PortalQuad {
  const center = a.clone().add(b).add(c).multiplyScalar(1 / 3);
  return [a.clone(), b.clone(), c.clone().lerp(b, portalCornerCut), c.clone().lerp(a, portalCornerCut)]
    .map(point => point.lerp(center, .025)) as PortalQuad;
}

/** One screen-to-UV homography for the whole face; no diagonal affine splice. */
export function portalUvProjection([topLeft, bottomLeft, bottomRight, topRight]: PortalQuad) {
  const p0 = bottomLeft, p1 = bottomRight, p2 = topRight, p3 = topLeft;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < 1e-10) return null;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const matrix = new Matrix3().set(
    p1.x - p0.x + g * p1.x, p3.x - p0.x + h * p3.x, p0.x,
    p1.y - p0.y + g * p1.y, p3.y - p0.y + h * p3.y, p0.y,
    g, h, 1,
  );
  if (Math.abs(matrix.determinant()) < 1e-10) return null;
  matrix.invert();
  const center = topLeft.clone().add(bottomLeft).add(bottomRight).add(topRight).multiplyScalar(.25);
  const normalization = matrix.elements[2] * center.x + matrix.elements[5] * center.y + matrix.elements[8];
  if (Math.abs(normalization) < 1e-10) return null;
  matrix.elements.forEach((_, i) => { matrix.elements[i] /= normalization; });
  return matrix;
}

/** Keep this mapping in step with WallPortal's fragment shader. */
export function portalQuadAt(source: PortalQuad, progress: number, width=1280, height=720): PortalQuad {
  const square=portalSquare(width,height);
  const destination: PortalQuad = [
    new Vector2(-.04, 1.04), new Vector2(-.04, -.04),
    new Vector2(1.04, -.04), new Vector2(1.04, 1.04),
  ];
  return source.map((point,index)=>new Vector2(
    openingCoordinate(point.x,square[index].x,destination[index].x,progress),
    openingCoordinate(point.y,square[index].y,destination[index].y,progress),
  )) as PortalQuad;
}

export function portalSquare(width: number, height: number): PortalQuad {
  const side=Math.min(width,height)*squareShortSide, x=side/width/2,y=side/height/2;
  return [new Vector2(.5-x,.5+y),new Vector2(.5-x,.5-y),new Vector2(.5+x,.5-y),new Vector2(.5+x,.5+y)];
}

function contains(point: Vector2, a: Vector2, b: Vector2, c: Vector2) {
  const ab = b.clone().sub(a), ac = c.clone().sub(a), ap = point.clone().sub(a);
  const denominator = ab.x * ac.y - ac.x * ab.y;
  if (Math.abs(denominator) < .00025) return false;
  const u = (ap.x * ac.y - ac.x * ap.y) / denominator;
  const v = (ab.x * ap.y - ap.x * ab.y) / denominator;
  return Math.min(1 - u - v, u, v) >= -.0008;
}

/** Tests all viewport corners against the same two triangles rasterized by the shader. */
export function portalCoversViewport(points: PortalQuad) {
  const corners = [new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 0), new Vector2(1, 1)];
  return corners.every(point => portalContainsPoint(points, point));
}

export function portalContainsPoint([a, b, c, d]: PortalQuad, point: Vector2) {
  return contains(point, a, b, c) || contains(point, a, c, d);
}

// Bricks settle at their reading coordinates; there is no final group rise.
export function portalWallY(_build: number) { return 0; }
