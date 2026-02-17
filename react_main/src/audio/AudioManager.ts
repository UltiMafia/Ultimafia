/**
 * AudioManager — imperative wrapper around HTMLAudioElement instances.
 *
 * Manages loading, playing, pausing and per-channel volume for all in-game
 * audio.
 */

export type AudioChannel = "sfx" | "music" | "important";

export interface AudioEntry {
  fileName: string;
  loop?: boolean;
  volume?: number;
  overrides?: boolean;
  channel?: AudioChannel;
}

export interface LoadedTrack {
  el: HTMLAudioElement;
  volume: number;
  overrides: boolean;
  channel: AudioChannel;
}

export default class AudioManager {
  tracks: Record<string, LoadedTrack> = {};

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Infer a default channel from a filename when none is provided. */
  static inferChannel(fileName: string): AudioChannel {
    if (fileName.includes("music")) return "music";
    return "sfx";
  }

  /** Clamp a number to [0, 1], returning `fallback` for non-finite input. */
  static clamp(value: unknown, fallback: number = 1): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed < 0) return 0;
    if (parsed > 1) return 1;
    return parsed;
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  /**
   * Load (or reload) a set of audio entries.
   *
   * If the file was already loaded its element is reused (paused first so loop
   * changes apply).
   */
  load(entries: AudioEntry[]): void {
    if (!Array.isArray(entries) || entries.length === 0) return;

    for (const entry of entries) {
      const {
        fileName,
        loop = false,
        volume = 1,
        overrides = false,
        channel,
      } = entry;

      if (!fileName) continue;

      const existing = this.tracks[fileName];
      if (!existing) {
        const el = new Audio(`/audio/${fileName}.mp3`);
        el.load();
        el.loop = loop;
        this.tracks[fileName] = {
          el,
          volume,
          overrides,
          channel: channel || AudioManager.inferChannel(fileName),
        };
      } else {
        // Pause before changing loop to make sure the change applies.
        existing.el.pause();
        existing.el.loop = loop;
        existing.volume = volume;
        existing.overrides = overrides;
        existing.channel = channel || AudioManager.inferChannel(fileName);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  /** Play a single audio file by name.  Pauses other overriding tracks first. */
  play(audioName: string): void {
    const track = this.tracks[audioName];
    if (!track) return;

    // If this file is marked as overriding, pause all other override tracks.
    if (track.overrides) {
      for (const name in this.tracks) {
        if (this.tracks[name].overrides) {
          this.tracks[name].el.pause();
        }
      }
    }

    track.el.currentTime = 0;
    track.el.play().catch(() => {});
  }

  /**
   * Stop a single audio file, or *all* audio files when called without an
   * argument.
   */
  stop(audioName?: string): void {
    if (audioName != null) {
      const track = this.tracks[audioName];
      if (track) track.el.pause();
    } else {
      for (const name in this.tracks) {
        this.tracks[name].el.pause();
      }
    }
  }

  /** Stop a list of audio files by name. */
  stopMany(audioNames: string[]): void {
    if (!Array.isArray(audioNames)) return;
    for (const name of audioNames) {
      const track = this.tracks[name];
      if (track) track.el.pause();
    }
  }

  // ---------------------------------------------------------------------------
  // Volume
  // ---------------------------------------------------------------------------

  /**
   * Synchronise every loaded element's actual volume with the current slider
   * values.
   */
  syncVolume(sfxVolume: number, musicVolume: number): void {
    const _sfxVolume = AudioManager.clamp(sfxVolume);
    const _musicVolume   = AudioManager.clamp(musicVolume);

    for (const name in this.tracks) {
      const { el, volume, channel } = this.tracks[name];

      // "important" channel bypasses sliders (used for vegPing and urgent).
      if (channel === "important") {
        el.volume = volume;
        continue;
      }

      const slider = channel === "music" ? _musicVolume : _sfxVolume;
      el.volume = volume * slider;
    }
  }

  get loadedNames(): string[] {
    return Object.keys(this.tracks);
  }
}
