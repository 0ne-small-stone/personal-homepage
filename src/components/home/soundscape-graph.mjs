// Original LSSH air texture. No recording, tune, LFO, or stereo movement.
export const soundscapeConfig = Object.freeze({seed:0x4c535348,seconds:4,sampleRate:32000,gain:.024,
  chapters:{intro:[120,1400,1],album:[180,2200,.8],radio:[120,1800,.8],projects:[180,1000,.9],wall:[150,1600,.65]}});
export function noiseSamples() {
  const samples=new Float32Array(soundscapeConfig.sampleRate*soundscapeConfig.seconds);
  let seed=soundscapeConfig.seed,mean=0;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/0x80000000-1;};
  let previous=random(),next=random();
  // Band-limited random control points, 8 samples apart; no tonal component.
  for(let i=0;i<samples.length;i++){if(i&&i%8===0){previous=next;next=random();}const t=(i%8)/8;samples[i]=previous+(next-previous)*t;mean+=samples[i];}
  mean/=samples.length;for(let i=0;i<samples.length;i++)samples[i]-=mean;
  // Fade the seam endpoints to a common value, not a repeated edge impulse.
  const edge=(samples[0]+samples.at(-1))/2;
  for(let i=0;i<128;i++){const w=(1-i/128)**2;samples[i]+=(edge-samples[i])*w;samples[samples.length-1-i]+=(edge-samples[samples.length-1-i])*w;}
  return samples;
}
/** @param {BaseAudioContext} context */
export function createSoundscapeGraph(context) {
  const source=context.createBufferSource(),high=context.createBiquadFilter(),low=context.createBiquadFilter(),gain=context.createGain();
  const buffer=context.createBuffer(1,soundscapeConfig.seconds*soundscapeConfig.sampleRate,soundscapeConfig.sampleRate);
  buffer.copyToChannel(noiseSamples(),0);source.buffer=buffer;source.loop=true;
  high.type='highpass';low.type='lowpass';high.Q.value=low.Q.value=.707;
  high.frequency.value=120;low.frequency.value=1400;gain.gain.value=0;
  source.connect(high);high.connect(low);low.connect(gain);gain.connect(context.destination);source.start();
  return {source,high,low,gain,dispose(){source.stop();source.disconnect();high.disconnect();low.disconnect();gain.disconnect();}};
}
/** @param {AudioParam} param @param {number} value @param {number} now @param {number} seconds */
export function glide(param,value,now,seconds) {
  if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);
  else {const current=param.value;param.cancelScheduledValues(now);param.setValueAtTime(current,now);}
  param.linearRampToValueAtTime(value,now+seconds);
}
