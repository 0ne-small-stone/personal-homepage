import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { chapterPose, type JourneyModel } from './scene-state';
const poses=[[0,0,6],[.12,.03,6.2],[-.08,.03,6.1],[.12,0,6.2],[-.1,0,6.1],[0,0,6]];
export default function CameraRig({model,mobile,quiet}: {model:JourneyModel;mobile:boolean;quiet:boolean}){
  useFrame(({camera})=>{
    const {index,next,blend}=chapterPose(quiet?0:model.progress);
    const a=poses[index],b=poses[next];
    const shift=quiet||mobile?0:model.pointer.x*.055;
    camera.position.set(MathUtils.lerp(a[0],b[0],blend)+shift,MathUtils.lerp(a[1],b[1],blend),MathUtils.lerp(a[2],b[2],blend));
    camera.lookAt(0,0,0);
  },-2);
  return null;
}
