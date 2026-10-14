import {spectralTable} from './spectral-table.js';
// Malitson 1965, fused silica at 20 C. Wavelength in nm; equation uses micrometres.
export function fusedSilicaIOR(nm){const l2=(nm/1000)**2;return Math.sqrt(1+.6961663*l2/(l2-.0684043**2)+.4079426*l2/(l2-.1162414**2)+.8974794*l2/(l2-9.896161**2));}
export function xyzToRGB([x,y,z]){return [3.2406*x-1.5372*y-.4986*z,-.9689*x+1.8758*y+.0415*z,.0557*x-.204*y+1.057*z];}
export function makeSpectrum(count=32,flat=false,single=null){
  const samples=Array.from({length:count},(_,i)=>({index:i,energy:0,lambdaEnergy:0,xyz:[0,0,0]}));let total=0,yIntegral=0;
  for(let j=0;j<400;j++){const a=spectralTable[j],b=spectralTable[j+1],wave=a[0]+.5,spd=(a[4]+b[4])*.5,cmf=a.slice(1,4).map((v,k)=>(v+b[k+1])*.5),id=Math.min(count-1,Math.floor(j*count/400)),bin=samples[id];total+=spd;yIntegral+=spd*cmf[1];bin.energy+=spd;bin.lambdaEnergy+=wave*spd;cmf.forEach((v,k)=>bin.xyz[k]+=v*spd);}
  const exposure=yIntegral/total;
  if(single!==null){const at=Math.max(0,Math.min(399,Math.floor(single-380))),a=spectralTable[at],b=spectralTable[at+1],t=single-a[0];return [{index:0,wavelength:single,ior:fusedSilicaIOR(flat?550:single),power:16,fraction:1,xyz:a.slice(1,4).map((v,k)=>(v+(b[k+1]-v)*t)/exposure)}];}
  return samples.map(s=>{const wave=s.lambdaEnergy/s.energy,ior=flat?fusedSilicaIOR(550):fusedSilicaIOR(wave);return {...s,wavelength:wave,ior,power:16*s.energy/total,fraction:s.energy/total,xyz:s.xyz.map(v=>v/s.energy/exposure)};});
}
