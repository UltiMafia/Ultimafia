/**
 * AudioManager — imperative wrapper around HTMLAudioElement instances.
 *
 * Manages loading, playing, pausing and per-channel volume for all in-game
 * audio.
 *
 * Elements are created on first play, not at load time. `load()` used to
 * construct an HTMLAudioElement and call `.load()` for every entry it was given,
 * which for Mafia is 66 of them in one go. That costs almost no JavaScript --
 * both calls return immediately -- but it hands 66 media resources to the
 * platform at once, and iOS keeps a low ceiling on how many it will carry.
 * Measured on an iPhone 16, the resulting stall blocked painting for anywhere
 * between 2 and 88 seconds after React had already committed the DOM, so the
 * page sat there showing stale pixels. Creating them on demand takes a typical
 * Mafia game from 66 elements down to the handful it actually plays.
 */

export type AudioChannel = "sfx" | "music" | "pregameMusic" | "important";

export interface AudioEntry {
  fileName: string;
  loop?: boolean;
  volume?: number;
  overrides?: boolean;
  channel?: AudioChannel;
}

export interface LoadedTrack {
  /** Null until the track is first played. */
  el: HTMLAudioElement | null;
  fileName: string;
  loop: boolean;
  volume: number;
  overrides: boolean;
  channel: AudioChannel;
}

interface ChannelVolumes {
  sfx: number;
  music: number;
  pregameMusic: number;
  important: number;
}

export default class AudioManager {
  tracks: Record<string, LoadedTrack> = {};

  /**
   * Last volumes applied via syncVolume, so an element created later can be set
   * up correctly without waiting for the next sync.
   */
  private volumes: ChannelVolumes = {
    sfx: 1,
    music: 1,
    pregameMusic: 1,
    important: 1,
  };

  constructor() {
    // Without this, iOS Safari treats every HTMLAudioElement as exclusive
    // "playback" audio and pauses other tabs' media (YouTube, Spotify, etc.)
    // when we play a UI sound — e.g. the ready-check ping silencing a video
    // the user was watching. "ambient" lets our sounds mix in instead.
    const nav = navigator as Navigator & {
      audioSession?: { type?: string };
    };
    if (nav.audioSession) {
      try {
        nav.audioSession.type = "ambient";
      } catch {}
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Infer a default channel from a filename when none is provided. */
  static inferChannel(fileName: string): AudioChannel {
    if (fileName.includes("music/Pregame")) return "pregameMusic";
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

  private sliderFor(channel: AudioChannel): number {
    if (channel === "music") return this.volumes.music;
    if (channel === "pregameMusic") return this.volumes.pregameMusic;
    if (channel === "important") return this.volumes.important;
    return this.volumes.sfx;
  }

  /** True for short one-shot effects, false for the long music tracks. */
  private static isSfx(channel: AudioChannel): boolean {
    return channel !== "music" && channel !== "pregameMusic";
  }

  /**
   * Create the element for a track if it does not exist yet.
   *
   * `buffer` asks the browser to fetch ahead, which is what makes a sound audible
   * the instant it is played rather than once the fetch lands.
   */
  private ensureElement(
    track: LoadedTrack,
    buffer: boolean = false
  ): HTMLAudioElement | null {
    if (track.el) return track.el;

    try {
      const el = new Audio(`/audio/${track.fileName}.mp3`);
      el.preload = buffer ? "auto" : "metadata";
      el.loop = track.loop;
      el.volume = track.volume * this.sliderFor(track.channel);
      track.el = el;
      return el;
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  /**
   * Register (or re-register) a set of audio entries. This only records their
   * configuration; the element itself is built on first play.
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

      const resolvedChannel = channel || AudioManager.inferChannel(fileName);
      const existing = this.tracks[fileName];

      if (existing) {
        // Pause before changing loop to make sure the change applies.
        if (existing.el) {
          existing.el.pause();
          existing.el.loop = loop;
        }
        existing.loop = loop;
        existing.volume = volume;
        existing.overrides = overrides;
        existing.channel = resolvedChannel;
      } else {
        const track: LoadedTrack = {
          el: null,
          fileName,
          loop,
          volume,
          overrides,
          channel: resolvedChannel,
        };
        this.tracks[fileName] = track;

        // Sound effects are built and buffered up front; music is left until it
        // is first played.
        //
        // The split is by weight, not by principle: all 26 effect files together
        // are 1.5MB, while the 62 music tracks are 82MB. Handing the platform the
        // music up front is what stalled iOS, and effects are cheap enough that
        // there is no reason to make them lazy -- doing so made short cues
        // inaudible, because a sound that is stopped shortly after it starts (the
        // ready-check alarm, which ends as soon as everyone readies) was still
        // fetching when the stop arrived and never made a sound at all.
        if (AudioManager.isSfx(resolvedChannel)) {
          this.ensureElement(track, true);
        }
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
    // Only ones that exist can be playing.
    if (track.overrides) {
      for (const name in this.tracks) {
        const other = this.tracks[name];
        if (other.overrides && other.el) other.el.pause();
      }
    }

    const el = this.ensureElement(track, true);
    if (!el) return;

    // Assigning currentTime forces a seek, which on iOS can block on a track
    // that is not buffered. A freshly created element is already at zero.
    if (el.currentTime > 0) el.currentTime = 0;

    el.play().catch(() => {});
  }

  /**
   * Stop a single audio file, or *all* audio files when called without an
   * argument.
   */
  stop(audioName?: string): void {
    if (audioName != null) {
      const track = this.tracks[audioName];
      if (track && track.el) track.el.pause();
    } else {
      for (const name in this.tracks) {
        const track = this.tracks[name];
        if (track.channel === "important") continue;
        if (track.el) track.el.pause();
      }
    }
  }

  /** Stop a list of audio files by name. */
  stopMany(audioNames: string[]): void {
    if (!Array.isArray(audioNames)) return;
    for (const name of audioNames) {
      const track = this.tracks[name];
      if (track && track.el) track.el.pause();
    }
  }

  /**
   * Release every element. Without this the elements outlive the game they were
   * created for, since nothing else drops the references.
   */
  dispose(): void {
    for (const name in this.tracks) {
      const track = this.tracks[name];
      if (!track.el) continue;

      try {
        track.el.pause();
        track.el.src = "";
        track.el.load();
      } catch (e) {
        // Element may already be torn down by the browser.
      }
      track.el = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Volume
  // ---------------------------------------------------------------------------

  /**
   * Synchronise every loaded element's actual volume with the current slider
   * values.
   */
  syncVolume(
    sfxVolume: number,
    musicVolume: number,
    pregameMusicVolume: number,
    importantVolume: number
  ): void {
    this.volumes = {
      sfx: AudioManager.clamp(sfxVolume),
      music: AudioManager.clamp(musicVolume),
      pregameMusic: AudioManager.clamp(pregameMusicVolume),
      important: AudioManager.clamp(importantVolume),
    };

    for (const name in this.tracks) {
      const { el, volume, channel } = this.tracks[name];
      if (!el) continue;
      el.volume = volume * this.sliderFor(channel);
    }
  }

  get loadedNames(): string[] {
    return Object.keys(this.tracks);
  }
}
