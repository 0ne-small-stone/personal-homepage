import { Environment, Lightformer } from '@react-three/drei';
export default function SceneLighting() {
  return <>
    <ambientLight intensity={.32} />
    <directionalLight position={[-4, 5, 5]} intensity={2.2} color="#f2efe8" />
    <directionalLight position={[4, -2, 3]} intensity={.7} color="#ededed" />
    <Environment resolution={128} frames={1}>
      <color attach="background" args={['#9c9c9c']} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 0, 5]} scale={[12, 12, 1]} />
      <Lightformer form="rect" intensity={4} color="#ffffff" position={[-3, 2, 3]} scale={[3, 5, 1]} />
      <Lightformer form="rect" intensity={2} color="#d4d4d4" position={[3, 0, 3]} scale={[2, 5, 1]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 4, -1]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={1.2} color="#d4d4d4" position={[0, -3, 4]} scale={[6, 2, 1]} />
    </Environment>
  </>;
}
