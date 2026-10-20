import { PerformanceMonitor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export default function HomePerformance({ onQuality }: { onQuality: (value: number) => void }) {
  const running = useThree(state => state.frameloop === 'always');
  // Demand-idle gaps are not slow frames. A fresh window starts with real activity.
  return running ? <PerformanceMonitor ms={300} iterations={4} flipflops={2} bounds={() => [45, 65]}
    onDecline={() => onQuality(.75)} onIncline={() => onQuality(1)} onFallback={() => onQuality(.75)} /> : null;
}
