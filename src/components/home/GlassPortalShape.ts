import { Box3, Camera, ExtrudeGeometry, Matrix4, Vector2, Vector3 } from 'three';
import { portalCornerCut, portalQuadAt, portalSquare, portalStartQuad, type PortalQuad } from './wall-portal-geometry.ts';
import { openingCoordinate } from './wall-assembly.ts';

/** Deform the existing front, bevel and back together in the same projected domain. */
export default class GlassPortalShape {
  readonly quad: PortalQuad = [new Vector2(), new Vector2(), new Vector2(), new Vector2()];
  frontCoversCorners = false;
  private readonly geometry: ExtrudeGeometry;
  private readonly original: Float32Array;
  private readonly normals: Float32Array;
  private readonly bounds: Box3;
  private readonly corners: Vector3[];
  private readonly domain: Float32Array;
  private readonly projected: Float32Array;
  private readonly frontTriangles: number[] = [];
  private readonly clip = new Matrix4();
  private readonly inverseClip = new Matrix4();
  private readonly point = new Vector3();
  private deformed = false;

  constructor(geometry: ExtrudeGeometry) {
    this.geometry = geometry;
    this.original = new Float32Array(geometry.getAttribute('position').array);
    this.normals = new Float32Array(geometry.getAttribute('normal').array);
    this.bounds = geometry.boundingBox!.clone();
    const authored = geometry.userData.lsshPrismCorners as Vector3[] | undefined;
    this.corners = authored?.map(p=>p.clone()) ?? [
      new Vector3(0,this.bounds.max.y,this.bounds.max.z),new Vector3(this.bounds.min.x,this.bounds.min.y,this.bounds.max.z),new Vector3(this.bounds.max.x,this.bounds.min.y,this.bounds.max.z),
    ];
    this.domain = new Float32Array(this.original.length / 3 * 2);
    this.projected = new Float32Array(this.domain.length);
    for(let i=0;i<this.original.length/3;i+=3) if(Math.abs(this.normals[i*3+2])>.999) this.frontTriangles.push(i);
    const width = this.corners[2].x-this.corners[1].x, height = this.corners[0].y-this.corners[1].y;
    for (let i = 0; i < this.original.length / 3; i++) {
      const topWeight = (this.original[i * 3 + 1] - this.corners[1].y) / height;
      const rightWeight = Math.min(.9995, (this.original[i * 3] - this.corners[1].x) / width - .5 * topWeight);
      // Bevel vertices can sit outside the ideal triangular domain. Keep them
      // on its boundary rather than extrapolating a second tip beyond the quad.
      this.domain[i * 2] = Math.max(0, Math.min(1, rightWeight / (1 - portalCornerCut)));
      this.domain[i * 2 + 1] = Math.max(0, Math.min(1, topWeight / (1 - rightWeight)));
    }
  }

  update(camera: Camera, world: Matrix4, progress: number, width=1280, height=720) {
    camera.updateMatrixWorld(true);
    this.clip.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(world);
    this.inverseClip.copy(this.clip).invert();
    const toUv = (x: number, y: number) => {
      this.point.set(x, y, this.bounds.max.z).applyMatrix4(this.clip);
      return new Vector2((this.point.x + 1) / 2, (this.point.y + 1) / 2);
    };
    const source = portalStartQuad(
      toUv(this.corners[0].x,this.corners[0].y),toUv(this.corners[1].x,this.corners[1].y),toUv(this.corners[2].x,this.corners[2].y),
    );
    const quad = portalQuadAt(source, progress, width, height);
    quad.forEach((point, i) => this.quad[i].copy(point));
    // Once fully open the glass is outside the visible handoff. Preserve the
    // shared quad, but avoid uploading hidden geometry throughout wall reading.
    if (progress >= .999) { this.frontCoversCorners = true; return; }
    const t = Math.max(0, Math.min(1, progress));
    const positions = this.geometry.getAttribute('position');
    if (t <= 1e-8) {
      this.frontCoversCorners = false;
      if (this.deformed) {
        positions.array.set(this.original);
        this.geometry.getAttribute('normal').array.set(this.normals);
        positions.needsUpdate = true;
        this.geometry.getAttribute('normal').needsUpdate = true;
        this.geometry.boundingBox!.copy(this.bounds);
        this.deformed = false;
      }
      return;
    }
    const square=portalSquare(width,height);
    for (let i = 0; i < positions.count; i++) {
      this.point.fromArray(this.original, i * 3).applyMatrix4(this.clip);
      const targetX = -1.08 + 2.16 * this.domain[i * 2];
      const targetY = -1.08 + 2.16 * this.domain[i * 2 + 1];
      const squareX=2*(square[0].x+(square[3].x-square[0].x)*this.domain[i*2])-1;
      const squareY=2*(square[1].y+(square[0].y-square[1].y)*this.domain[i*2+1])-1;
      this.point.x=openingCoordinate(this.point.x,squareX,targetX,t);
      this.point.y=openingCoordinate(this.point.y,squareY,targetY,t);
      this.projected[i*2] = this.point.x; this.projected[i*2+1] = this.point.y;
      this.point.applyMatrix4(this.inverseClip);
      positions.setXYZ(i, this.point.x, this.point.y, this.point.z);
    }
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingBox();
    this.deformed = true;
    // The compositor also clips to the real front cap. Require its triangles
    // to cover the viewport with an AA pixel margin, not just the logical quad.
    const mx=3/width,my=3/height;
    this.frontCoversCorners=[[-1-mx,-1-my],[-1-mx,1+my],[1+mx,-1-my],[1+mx,1+my]]
      .every(([x,y])=>this.frontTriangles.some(i=>this.containsFrontTriangle(i,x,y)));
  }

  private containsFrontTriangle(i:number,x:number,y:number) {
    const p=this.projected,ax=p[i*2],ay=p[i*2+1];
    const bx=p[(i+1)*2]-ax,by=p[(i+1)*2+1]-ay,cx=p[(i+2)*2]-ax,cy=p[(i+2)*2+1]-ay;
    const den=bx*cy-cx*by;
    if(den<1e-10)return false;
    const px=x-ax,py=y-ay,u=(px*cy-cx*py)/den,v=(bx*py-px*by)/den;
    return Math.min(1-u-v,u,v)>=-1e-6;
  }
}
