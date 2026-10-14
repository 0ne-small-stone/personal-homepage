import {Vector2,Vector3,Vector4} from 'three';
// Exact planar-face shortcut inside the actual convex mesh. Rounded bevels keep BVH.
export function capAccelerator(geometry){
 geometry.computeBoundingBox();const min=geometry.boundingBox.min.z,max=geometry.boundingBox.max.z,p=geometry.attributes.position,index=geometry.index,vertices=[],groups=new Map();for(let i=0;i<p.count;i++)vertices.push(new Vector3().fromBufferAttribute(p,i));let convexError=0;
 for(let i=0;i<(index?.count??p.count);i+=3){const points=[0,1,2].map(j=>vertices[index?index.getX(i+j):i+j]),[a,b,c]=points,n=b.clone().sub(a).cross(c.clone().sub(a)),area=n.length()/2;n.normalize();if(area<1e-9)continue;const d=n.dot(a);for(const v of vertices)convexError=Math.max(convexError,n.dot(v)-d);const key=[...n,d].map(v=>v.toFixed(5)).join(',');const g=groups.get(key)??{n,d,area:0,points:[]};g.area+=area;g.points.push(...points);groups.set(key,g);}
 if(convexError>2e-6)throw new Error('Prism is not convex');
 const capPoints=vertices.filter(v=>Math.abs(v.z-max)<1e-7).map(v=>new Vector2(v.x,v.y)),unique=[...new Map(capPoints.map(v=>[[v.x,v.y].join(','),v])).values()].sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lower=[],upper=[];
 for(const v of unique){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),v)<=1e-10)lower.pop();lower.push(v);}for(const v of unique.toReversed()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),v)<=1e-10)upper.pop();upper.push(v);}const hull=lower.slice(0,-1).concat(upper.slice(0,-1)),long=hull.map((v,i)=>({i,length:v.distanceTo(hull[(i+1)%hull.length])})).sort((a,b)=>b.length-a.length).slice(0,3),ids=[...new Set(long.flatMap(({i})=>[i,(i+1)%hull.length]))].sort((a,b)=>a-b),polygon=ids.map(i=>hull[i]);if(polygon.length!==6)throw new Error('Expected six cap-chord vertices');
 const edges=polygon.map((a,i)=>{const b=polygon[(i+1)%6],n=new Vector2(b.y-a.y,a.x-b.x).normalize();return new Vector3(n.x,n.y,n.dot(a));});
 const sides=[...groups.values()].filter(g=>Math.abs(g.n.z)<1e-6).sort((a,b)=>b.area-a.area).slice(0,3).map(g=>{const u=new Vector3(-g.n.y,g.n.x,0),t=g.points.map(v=>v.dot(u)),z=g.points.map(v=>v.z),bounds=[Math.min(...t),Math.max(...t),Math.min(...z),Math.max(...z)];for(const s of bounds.slice(0,2))for(const z of bounds.slice(2)){const q=g.n.clone().multiplyScalar(g.d).addScaledVector(u,s);q.z=z;if(!g.points.some(v=>v.distanceTo(q)<2e-6))throw new Error('Side shortcut is not an actual rectangle');}return {plane:new Vector4(...g.n,g.d),extent:new Vector4(...bounds)};});
 return {edges,sides,min,max,convexError,hullVertices:hull.length};
}
export const capGLSL=`
uniform vec3 capEdges[6];uniform vec4 sidePlanes[3],sideExtents[3];uniform vec2 capZ;uniform bool accelerateCaps;
bool internalHit(vec3 o,vec3 d,out vec3 point,out vec3 normal,out float distance){
 if(accelerateCaps){vec3 origin=(inversePrism*vec4(o,1.)).xyz,dir=(inversePrism*vec4(d,0.)).xyz;
  if(abs(dir.z)>1e-8&&origin.z>capZ.x&&origin.z<capZ.y){float z=dir.z>0.?capZ.y:capZ.x,t=(z-origin.z)/dir.z;vec2 q=origin.xy+dir.xy*t;bool within=t>epsilon;for(int j=0;j<6;j++)within=within&&dot(capEdges[j].xy,q)<capEdges[j].z-1e-6;
   if(within){distance=t;point=o+d*t;normal=normalize(transpose(mat3(inversePrism))*vec3(0.,0.,dir.z>0.?-1.:1.));return true;}}
  for(int j=0;j<3;j++){vec4 plane=sidePlanes[j];float slope=dot(plane.xyz,dir);if(slope<=1e-8)continue;float t=(plane.w-dot(plane.xyz,origin))/slope;if(t<=epsilon)continue;vec3 p=origin+dir*t;float along=dot(vec3(-plane.y,plane.x,0.),p);vec4 ext=sideExtents[j];if(along>ext.x+1e-6&&along<ext.y-1e-6&&p.z>ext.z+1e-6&&p.z<ext.w-1e-6){distance=t;point=o+d*t;normal=normalize(transpose(mat3(inversePrism))*(-plane.xyz));return true;}}
 }return glassHit(o,d,point,normal,distance);
}
`;
