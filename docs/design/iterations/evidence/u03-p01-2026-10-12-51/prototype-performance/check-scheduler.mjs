import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {RenderScheduler} from './render-scheduler.js';
import {makeTriangleGeometry} from './geometry.js';
import {BeamField} from './beam-field.js';
const checks=[];function test(name,fn){fn();checks.push(name);}
function harness(){let next=0,hidden=false,more=true,draws=0;const frames=new Map(),scheduler=new RenderScheduler(()=>draws++,()=>more,{requestFrame:fn=>{frames.set(++next,fn);return next;},cancelFrame:id=>frames.delete(id),isHidden:()=>hidden});return {scheduler,frames,get draws(){return draws;},more:value=>more=value,hidden:value=>hidden=value,step(){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(draws*16.7);}};}
test('Multiple input invalidations schedule only one frame',()=>{const h=harness();h.scheduler.request();h.scheduler.request();h.scheduler.request();assert.equal(h.frames.size,1);h.scheduler.dispose();});
test('Converged field stops GPU draw scheduling entirely',()=>{const h=harness();h.scheduler.request();for(let i=0;i<5;i++)h.step();h.more(false);h.step();assert.equal(h.draws,6);assert.equal(h.frames.size,0);});
test('A real input resumes idle render once',()=>{const h=harness();h.more(false);h.scheduler.request();h.step();h.scheduler.request();h.step();assert.equal(h.draws,2);assert.equal(h.frames.size,0);});
test('Hidden page cancels frame and resumes unfinished sampling when visible',()=>{const h=harness();h.scheduler.request();h.hidden(true);h.scheduler.visibilityChanged();assert.equal(h.frames.size,0);h.scheduler.request();assert.equal(h.frames.size,0);h.hidden(false);h.scheduler.visibilityChanged();assert.equal(h.frames.size,1);h.step();assert.equal(h.draws,1);h.scheduler.dispose();});
test('Showing a converged page does not wake heavy rendering',()=>{const h=harness();h.more(false);h.hidden(true);h.scheduler.visibilityChanged();h.hidden(false);h.scheduler.visibilityChanged();assert.equal(h.frames.size,0);});
test('Disposal cancels pending work and future input cannot restart it',()=>{const h=harness();h.scheduler.request();h.scheduler.dispose();h.scheduler.request();assert.equal(h.frames.size,0);assert.equal(h.draws,0);});
const geometry=makeTriangleGeometry(),field=new BeamField(geometry),min=field.material.uniforms.glassMin.value,max=field.material.uniforms.glassMax.value;
test('Broad-phase bounds contain every real geometry vertex',()=>{const p=geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(p.getX(i)>=min.x&&p.getX(i)<=max.x&&p.getY(i)>=min.y&&p.getY(i)<=max.y&&p.getZ(i)>=min.z&&p.getZ(i)<=max.z);});
let rejects=0;test('Fast bound preserves full hull classification over 32^3 probe positions',()=>{for(let ix=0;ix<32;ix++)for(let iy=0;iy<32;iy++)for(let iz=0;iz<32;iz++){const p=[-3+6*ix/31,-3+6*iy/31,-1+2*iz/31],full=field.planes.every(n=>n[0]*p[0]+n[1]*p[1]+n[2]*p[2]<=n[3]+.000001),outside=p[0]<min.x-.0001||p[0]>max.x+.0001||p[1]<min.y-.0001||p[1]>max.y+.0001||p[2]<min.z-.0001||p[2]>max.z+.0001;if(outside)rejects++;assert.equal(!outside&&full,full);}});
let maximumRelativeError=0;test('Float32 Gaussian recurrence agrees with independent direct midpoint quadrature',()=>{
  const f=Math.fround,r=.009,r2=r*r;
  for(let k=0;k<1000;k++){const slope=-.999+1.998*k/999,side=Math.sqrt(1-slope*slope),dt=Math.min(r*.5/side,3),q=-4*r+side*dt*.5,t0=.1+40*(k%73)/72,along=12*(k%17)/16,transverse=r*(k%11)/11;
    let weight=f(Math.exp(-(q*q+transverse*transverse)/(2*r2)-.025*(along+(1+slope)*t0))),ratio=f(Math.exp(-(q*side*dt+.5*side*side*dt*dt)/r2-.025*(1+slope)*dt)),decay=f(Math.exp(-side*side*dt*dt/r2)),sum=0,reference=0;
    for(let i=0;i<16;i++){if(i%5!==k%5){sum+=weight;const x=q+side*dt*i,t=t0+i*dt;reference+=Math.exp(-(x*x+transverse*transverse)/(2*r2)-.025*(along+(1+slope)*t));}weight=f(weight*ratio);ratio=f(ratio*decay);}
    maximumRelativeError=Math.max(maximumRelativeError,Math.abs(sum-reference)/reference);
  }assert.ok(maximumRelativeError<.0002,`${maximumRelativeError}`);
});
test('Convex ray interval matches independent point-in-hull tests, including parallel rays',()=>{
  for(let k=0;k<1024;k++){const origin=[-2+4*(k%32)/31,-2+4*Math.floor(k/32)/31,3],dir=[(k%7-3)*.04,(k%11-5)*.03,-1];let entry=0,exit=10,valid=true;
    for(const n of field.planes){const d=n[0]*dir[0]+n[1]*dir[1]+n[2]*dir[2],distance=n[3]+.000001-n[0]*origin[0]-n[1]*origin[1]-n[2]*origin[2];if(Math.abs(d)<1e-9){if(distance<0){valid=false;break;}}else if(d<0)entry=Math.max(entry,distance/d);else exit=Math.min(exit,distance/d);if(exit<entry){valid=false;break;}}
    for(let i=0;i<64;i++){const t=(i+.5)*10/64,p=origin.map((x,j)=>x+dir[j]*t),full=field.planes.every(n=>n[0]*p[0]+n[1]*p[1]+n[2]*p[2]<=n[3]+.000001);assert.equal(valid&&t>=entry&&t<=exit,full);}
  }
});
field.dispose();geometry.dispose();const result={passed:checks.length,checks,probePositions:32768,broadPhaseRejected:rejects,quadratureComparisons:1000,maximumRelativeError,sourceAndTransportParametersChanged:false};await fs.writeFile('docs/design/iterations/evidence/u03-p01-2026-10-12-51/white-perf-checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
