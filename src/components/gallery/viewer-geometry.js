export function viewerPadding({x,y}){
  if(x>650&&y<=560)return {top:92,bottom:48,left:68,right:68};
  return x<=650?{top:126,bottom:86,left:16,right:16}:{top:128,bottom:72,left:96,right:96};
}
export function fitFrame(photo,viewport){
  const pad=viewerPadding(viewport),scale=Math.min(1,(viewport.x-pad.left-pad.right)/photo.width,(viewport.y-pad.top-pad.bottom)/photo.height);
  const width=photo.width*scale,height=photo.height*scale;
  return {x:pad.left+(viewport.x-pad.left-pad.right-width)/2,y:pad.top+(viewport.y-pad.top-pad.bottom-height)/2,width,height};
}
export const rectQuad=r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
export function quadVisible(points,viewport){
  if(!points||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  return Math.max(...xs)>0&&Math.min(...xs)<viewport.x&&Math.max(...ys)>0&&Math.min(...ys)<viewport.y&&Math.max(...xs)-Math.min(...xs)>4&&Math.max(...ys)-Math.min(...ys)>4;
}
// Project a complete rectangular photo onto the actual perspective quadrilateral.
// CSS column-major matrix; this is a one-off bridge, never a per-frame DOM scan.
export function quadMatrix(points,width,height){
  const [p0,p1,p2,p3]=points;
  const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
  const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const determinant=dx1*dy2-dx2*dy1;
  const g=Math.abs(determinant)>1e-9?(dx3*dy2-dx2*dy3)/determinant:0;
  const h=Math.abs(determinant)>1e-9?(dx1*dy3-dx3*dy1)/determinant:0;
  return [ (p1.x-p0.x+g*p1.x)/width,(p1.y-p0.y+g*p1.y)/width,0,g/width,
    (p3.x-p0.x+h*p3.x)/height,(p3.y-p0.y+h*p3.y)/height,0,h/height,
    0,0,1,0,p0.x,p0.y,0,1 ];
}
export const cssMatrix=values=>`matrix3d(${values.join(',')})`;
