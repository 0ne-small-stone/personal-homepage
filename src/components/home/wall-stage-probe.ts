import type {WebGLRenderer} from 'three';

export type StageRow={name:string;ms:number;programs:number|null;textures:number;geometries:number;calls:number;renders:number};
type Mark={at:number;programs:number|null;textures:number;geometries:number;calls:number;renders:number};

// Only attached by the explicit localhost wallPerf probe. Measures CPU submission
// and renderer-owned counters; no shader/texture hooks or synchronous GPU reads.
export class WallStageProbe {
  private open=new Map<string,Mark>();
  private rows:StageRow[]=[];
  private notes:Record<string,unknown>={};
  constructor(private gl:WebGLRenderer){}
  private mark():Mark{return {at:performance.now(),programs:this.gl.info.programs?.length??null,textures:this.gl.info.memory.textures,
    geometries:this.gl.info.memory.geometries,calls:this.gl.info.render.calls,renders:this.gl.info.render.frame};}
  beginFrame(){this.open.clear();this.rows=[];this.notes={};}
  start(name:string){this.open.set(name,this.mark());}
  end(name:string){
    const before=this.open.get(name);if(!before)return;
    const after=this.mark();this.open.delete(name);
    this.rows.push({name,ms:after.at-before.at,programs:after.programs===null||before.programs===null?null:after.programs-before.programs,textures:after.textures-before.textures,
      geometries:after.geometries-before.geometries,calls:after.calls-before.calls,renders:after.renders-before.renders});
  }
  note(name:string,value:unknown){this.notes[name]=value;}
  take(){return {stages:this.rows,unfinished:[...this.open.keys()],notes:this.notes,resources:{programs:this.gl.info.programs?.length??null,...this.gl.info.memory}};}
}
