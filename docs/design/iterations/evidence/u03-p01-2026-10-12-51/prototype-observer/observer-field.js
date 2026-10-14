import {DataTexture,FloatType,RGBAFormat,Vector3} from './node_modules/three/build/three.module.js';
import {KERNEL_RADIUS} from './beam-field.js';
// A small threaded spatial tree over photon beams. Preorder escape links avoid a GPU traversal stack.
export class ObserverField {
  constructor(){this.capacity=2048;this.nodes=new Float32Array(4096*8);this.beams=new Float32Array(2048*8);this.nodeTexture=new DataTexture(this.nodes,4096,2,RGBAFormat,FloatType);this.beamTexture=new DataTexture(this.beams,2048,2,RGBAFormat,FloatType);this.nodeCount=0;this.ordered=[];}
  update(records,receivers){
    this.nodes.fill(0);this.beams.fill(0);this.nodeCount=0;this.ordered=records;
    const bounds=records.map(record=>{let pad=8*KERNEL_RADIUS;const direction=record.b.clone().sub(record.a).normalize();if(record.receiverId>=0)pad/=Math.max(.001,Math.abs(direction.dot(receivers[record.receiverId].normal)));return {min:record.a.clone().min(record.b).addScalar(-pad),max:record.a.clone().max(record.b).addScalar(pad),center:record.a.clone().add(record.b).multiplyScalar(.5)};});
    records.forEach((r,i)=>{this.beams.set([...r.a,r.power],i*4);this.beams.set([...r.b,r.receiverId+1],this.capacity*4+i*4);});
    const build=indices=>{const id=this.nodeCount++;const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);for(const i of indices){min.min(bounds[i].min);max.max(bounds[i].max);}let leaf=-1;
      if(indices.length===1)leaf=indices[0];else{const extent=max.clone().sub(min),axis=extent.x>extent.y?(extent.x>extent.z?'x':'z'):(extent.y>extent.z?'y':'z');indices.sort((a,b)=>bounds[a].center[axis]-bounds[b].center[axis]);const half=Math.floor(indices.length/2);build(indices.slice(0,half));build(indices.slice(half));}
      this.nodes.set([...min,leaf],id*4);this.nodes.set([...max,this.nodeCount],4096*4+id*4);return id;};
    if(records.length)build(records.map((_,i)=>i));this.nodeTexture.needsUpdate=true;this.beamTexture.needsUpdate=true;
  }
  dispose(){this.nodeTexture.dispose();this.beamTexture.dispose();}
}
