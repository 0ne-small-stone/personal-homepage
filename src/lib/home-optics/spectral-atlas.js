import {DataTexture,FloatType,RGBAFormat} from 'three';
function texture(data){const padded=new Float32Array(Math.ceil(data.length/4/256)*256*4||1024);padded.set(data);const result=new DataTexture(padded,256,padded.length/1024,RGBAFormat,FloatType);result.needsUpdate=true;return result;}
export class SpectralAtlas{
  constructor(){this.nodes=null;this.beams=null;this.meta=null;this.rows=[];}
  build(results,bands){this.dispose();const nodeLength=results.reduce((s,r)=>s+r.nodes.length,0),beamLength=results.reduce((s,r)=>s+r.beams.length,0),nodes=new Float32Array(nodeLength),oriented=new Float32Array(nodeLength*2),beams=new Float32Array(beamLength),meta=new Float32Array(bands.length*8);let n=0,b=0;
    this.rows=results;results.forEach((r,i)=>{nodes.set(r.nodes,n);if(r.oriented)oriented.set(r.oriented,n*2);beams.set(r.beams,b);meta.set([bands[i].ior,r.nodeCount,n/8,b/8],i*4);meta.set([...bands[i].xyz,bands[i].wavelength],bands.length*4+i*4);n+=r.nodes.length;b+=r.beams.length;});this.nodes=texture(nodes);this.oriented=texture(oriented);this.beams=texture(beams);this.meta=new DataTexture(meta,bands.length,2,RGBAFormat,FloatType);this.meta.needsUpdate=true;this.bytes=this.oriented.image.data.byteLength+this.nodes.image.data.byteLength+this.beams.image.data.byteLength+meta.byteLength;
  }
  dispose(){this.nodes?.dispose();this.oriented?.dispose();this.beams?.dispose();this.meta?.dispose();}
}
