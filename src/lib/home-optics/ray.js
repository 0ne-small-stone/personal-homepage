import { Matrix3, Matrix4, Ray, Triangle, Vector3 } from "three";
export const PRISM_LIGHT_LAYER = 2;
export const MAX_INTERFACES = 8;
export const PRISM_INCIDENT_SLOPE = 0.2532532084998948;
export function snellDirection(incident, facingNormal, n1, n2, output) {
  if (!(n1 > 0 && n2 > 0) || incident.lengthSq() < 1e-20 || facingNormal.lengthSq() < 1e-20) return "degenerate";
  const eta = n1 / n2, cosine = Math.max(0, Math.min(1, -incident.dot(facingNormal)));
  const discriminant = 1 - eta * eta * (1 - cosine * cosine);
  if (discriminant < -1e-12) {
    output.copy(incident).addScaledVector(facingNormal, 2 * cosine).normalize();
    return "reflect";
  }
  output.copy(incident).multiplyScalar(eta).addScaledVector(facingNormal, eta * cosine - Math.sqrt(Math.max(0, discriminant))).normalize();
  return Number.isFinite(output.lengthSq()) ? "refract" : "degenerate";
}
export class PrismRaySolver {
  points = Array.from({ length: MAX_INTERFACES + 2 }, () => new Vector3());
  events = Array.from({ length: MAX_INTERFACES }, () => ({ point: new Vector3(), normal: new Vector3(), incoming: new Vector3(), outgoing: new Vector3(), n1: 1, n2: 1, kind: "degenerate", face: -1 }));
  outputDirection = new Vector3();
  count = 0;
  eventCount = 0;
  status = "miss";
  rightward = false;
  epsilon = 0;
  faces;
  inverse = new Matrix4();
  normalMatrix = new Matrix3();
  ray = new Ray();
  origin = new Vector3();
  direction = new Vector3();
  hit = new Vector3();
  candidate = new Vector3();
  delta = new Vector3();
  normal = new Vector3();
  next = new Vector3();
  diameter;
  constructor(geometry, shared) {
    if (shared) {
      this.faces = shared.faces;
      this.diameter = shared.diameter;
      return;
    }
    this.faces = [];
    const positions = geometry.getAttribute("position"), indices = geometry.index;
    const count = indices?.count ?? positions.count;
    for (let i = 0; i < count; i += 3) {
      const a = new Vector3().fromBufferAttribute(positions, indices ? indices.getX(i) : i);
      const b = new Vector3().fromBufferAttribute(positions, indices ? indices.getX(i + 1) : i + 1);
      const c = new Vector3().fromBufferAttribute(positions, indices ? indices.getX(i + 2) : i + 2);
      const normal = new Triangle(a, b, c).getNormal(new Vector3());
      if (normal.lengthSq() > 0.5) this.faces.push({ a, b, c, normal });
    }
    geometry.computeBoundingBox();
    this.diameter = geometry.boundingBox.getSize(new Vector3()).length();
  }
  trace(matrixWorld, origin, direction, glassIOR = 1.45, startsInside = false) {
    this.count = 1;
    this.eventCount = 0;
    this.rightward = false;
    this.outputDirection.set(0, 0, 0);
    this.points[0].copy(origin);
    this.status = "degenerate";
    if (Math.abs(matrixWorld.determinant()) < 1e-12 || direction.lengthSq() < 1e-20 || !Number.isFinite(direction.lengthSq()) || !Number.isFinite(origin.lengthSq()) || !(glassIOR > 0)) return;
    this.inverse.copy(matrixWorld).invert();
    this.normalMatrix.getNormalMatrix(matrixWorld);
    this.epsilon = this.diameter * matrixWorld.getMaxScaleOnAxis() * 1e-5;
    this.origin.copy(origin);
    this.direction.copy(direction).normalize();
    let inside = startsInside;
    for (let i = 0; i < MAX_INTERFACES; i++) {
      const face = this.nearest(matrixWorld);
      if (face < 0) {
        if (!inside && i === 0) {
          this.status = "miss";
          this.points[this.count++].copy(origin).addScaledVector(this.direction, 24);
        } else this.status = "degenerate";
        return;
      }
      this.normal.copy(this.faces[face].normal).applyMatrix3(this.normalMatrix).normalize();
      if (this.normal.dot(this.direction) > 0) this.normal.negate();
      const event = this.events[this.eventCount++];
      event.point.copy(this.hit);
      event.normal.copy(this.normal);
      event.incoming.copy(this.direction);
      event.n1 = inside ? glassIOR : 1;
      event.n2 = inside ? 1 : glassIOR;
      event.face = face;
      event.kind = snellDirection(this.direction, this.normal, event.n1, event.n2, this.next);
      this.points[this.count++].copy(this.hit);
      if (event.kind === "degenerate") {
        event.outgoing.set(0, 0, 0);
        this.status = "degenerate";
        return;
      }
      event.outgoing.copy(this.next);
      if (event.kind === "refract") inside = !inside;
      this.direction.copy(this.next);
      if (!inside) {
        this.status = "exited";
        this.outputDirection.copy(this.direction);
        this.rightward = this.direction.x > 1e-6;
        this.points[this.count++].copy(this.hit).addScaledVector(this.direction, 24);
        return;
      }
      this.origin.copy(this.hit).addScaledVector(this.direction, this.epsilon);
    }
    this.status = "truncated";
  }
  nearest(matrixWorld) {
    this.ray.origin.copy(this.origin).applyMatrix4(this.inverse);
    this.ray.direction.copy(this.direction).transformDirection(this.inverse);
    let nearest = Infinity, face = -1;
    for (let i = 0; i < this.faces.length; i++) {
      const triangle = this.faces[i];
      if (!this.ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, this.candidate)) continue;
      this.candidate.applyMatrix4(matrixWorld);
      const distance = this.delta.copy(this.candidate).sub(this.origin).dot(this.direction);
      if (distance > this.epsilon * 0.5 && distance < nearest) {
        nearest = distance;
        this.hit.copy(this.candidate);
        face = i;
      }
    }
    return face;
  }
  diagnostics() {
    return { status: this.status, rightward: this.rightward, epsilon: this.epsilon, points: this.points.slice(0, this.count).map((p) => p.toArray()), outputDirection: this.outputDirection.toArray(), events: this.events.slice(0, this.eventCount).map((e) => ({ point: e.point.toArray(), normal: e.normal.toArray(), incoming: e.incoming.toArray(), outgoing: e.outgoing.toArray(), n1: e.n1, n2: e.n2, kind: e.kind, face: e.face })), triangles: this.faces.length };
  }
}
