// Homepage profiles are opt-in: existing invitations retain their original wave.
export function gestureDuration(gesture: string | undefined) {
  return ({'home-explore':1.3,'home-warm-listen':1.05,'home-music':1.25,'home-balance':1.25,'home-hop':1.1} as Record<string,number>)[gesture ?? ''] ?? 1.45;
}
export function gestureSignal(gesture: string | undefined, phase: number) {
  const envelope = Math.sin(phase * Math.PI) ** 2;
  switch (gesture) {
    case 'home-explore': return 13 * Math.sin(phase * Math.PI * 4) * envelope;
    case 'home-warm-listen': return 3.5 * envelope;
    case 'home-music': return 5 * Math.sin(phase * Math.PI * 2) * envelope;
    case 'home-balance': return 9 * Math.sin(phase * Math.PI * 2) * envelope;
    case 'home-hop': return 8 * envelope;
    default: return -(gesture === 'listen' ? 7 : 20) * Math.sin(phase * Math.PI * 4) * envelope;
  }
}
export function gesturePoint(gesture: string | undefined, part: string, x: number, y: number, signal: number): [number,number] {
  let angle = 0, cx = 14.3, cy = 10.3;
  if (gesture === 'home-explore') {
    if (part === 'forearm') { angle = signal; cx = 15.2; cy = 12.7; }
  } else if (gesture === 'home-hop') return [x,y-signal*.12];
  else if (gesture === 'home-balance') { angle = signal; cx = 7.2; cy = 21; }
  else if (gesture === 'home-music' || gesture === 'home-warm-listen') {
    // Move the head, headphones and cupping hand as one connected upper body.
    if (part !== 'left-leg' && part !== 'right-leg') { angle = signal; cx = 10; cy = 15.5; }
  } else if (part === 'forearm') angle = signal;
  if (!angle) return [x,y];
  const radians = angle * Math.PI / 180, cosine = Math.cos(radians), sine = Math.sin(radians);
  return [cx + (x-cx)*cosine - (y-cy)*sine, cy + (x-cx)*sine + (y-cy)*cosine];
}
