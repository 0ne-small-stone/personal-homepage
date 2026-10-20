import { useSyncExternalStore } from 'react';
import { audioSession } from '../../lib/audio-session';
export function useAudioSession(progress = true) {
  return useSyncExternalStore(audioSession.subscribe, progress ? audioSession.getSnapshot : audioSession.getControlSnapshot, audioSession.getServerSnapshot);
}
