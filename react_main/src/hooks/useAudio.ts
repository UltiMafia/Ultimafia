import { useRef, useEffect, useCallback } from "react";
import AudioManager from "../audio/AudioManager";
import type { AudioEntry } from "../audio/AudioManager";

export interface AudioSettings {
  sfxVolume: number;
  musicVolume: number;
}

interface UseAudioReturn {
  playAudio: (audioName: string) => void;
  loadAudioFiles: (entries: AudioEntry[]) => void;
  stopAudio: (audioName?: string) => void;
  stopAudios: (audioNames: string[]) => void;
}

/**
 * React hook that owns an AudioManager instance and keeps its volume in sync
 * with the current game settings.
 *
 * Returns the same four-function tuple the old inline hook returned so that
 * every call-site stays compatible:
 *
 *   const { playAudio, loadAudioFiles, stopAudio, stopAudios } = useAudio(settings);
 */
export function useAudio(settings: AudioSettings): UseAudioReturn {
  const managerRef = useRef<AudioManager | null>(null);

  // Lazy-init so we only create one AudioManager per component lifetime.
  if (!managerRef.current) {
    managerRef.current = new AudioManager();
  }

  const manager = managerRef.current;

  // --- Volume sync --------------------------------------------------------
  // Re-apply channel volumes whenever the sliders change or after new files
  // are loaded (tracked via a counter so we don't depend on a changing ref).
  const loadCountRef = useRef(0);

  useEffect(() => {
    manager.syncVolume(settings.sfxVolume, settings.musicVolume);
  }, [settings.sfxVolume, settings.musicVolume, loadCountRef.current]);

  // --- Public API ---------------------------------------------------------

  const loadAudioFiles = useCallback(
    (entries: AudioEntry[]) => {
      if (entries.length === 0) return;

      manager.load(entries);

      // Bump counter so the volume-sync effect re-runs.
      loadCountRef.current += 1;

      // Immediately apply volumes to newly loaded files.
      manager.syncVolume(settings.sfxVolume, settings.musicVolume);
    },
    [manager, settings.sfxVolume, settings.musicVolume]
  );

  const playAudio = useCallback(
    (audioName: string) => {
      manager.play(audioName);
    },
    [manager]
  );

  const stopAudio = useCallback(
    (audioName?: string) => {
      manager.stop(audioName);
    },
    [manager]
  );

  const stopAudios = useCallback(
    (audioNames: string[]) => {
      manager.stopMany(audioNames);
    },
    [manager]
  );

  return { playAudio, loadAudioFiles, stopAudio, stopAudios };
}
