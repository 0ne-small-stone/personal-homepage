import { useSyncExternalStore } from 'react';
import { audioSession } from '../../lib/audio-session';
export function useAudioSession() {
  return useSyncExternalStore(audioSession.subscribe, audioSession.getSnapshot, audioSession.getServerSnapshot);
}
