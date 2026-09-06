import WebAudioSound from "./WebAudioSound";

export type AudioChannel = "sfx" | "music" | "pregameMusic" | "important";

export interface AudioEntry {
  fileName: string;
  loop?: boolean;
  volume?: number;
  overrides?: boolean;
  channel?: AudioChannel;
  /** Buffer short cues ahead of playback. Long music loads on demand. */
  preload?: boolean;
}

export interface LoadedTrack {
  sound: WebAudioSound;
  fileName: string;
  loop: boolean;
  volume: number;
  overrides: boolean;
  channel: AudioChannel;
  preload: boolean;
}

export default class AudioManager {
  tracks: Record<string, LoadedTrack> = {};
  private transientSounds = new Set<WebAudioSound>();
  private generation = 0;
  private volumes: Record<AudioChannel, number> = {
    sfx: 1, music: 1, pregameMusic: 1, important: 1,
  };

  static inferChannel(fileName: string): AudioChannel {
    if (fileName.includes("music/Pregame")) return "pregameMusic";
    if (fileName.includes("music")) return "music";
    return "sfx";
  }

  static clamp(value: unknown, fallback = 1): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
  }

  load(entries: AudioEntry[]): void {
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
      if (!entry.fileName) continue;
      const channel = entry.channel || AudioManager.inferChannel(entry.fileName);
      const preload = entry.preload ?? (channel !== "music" && channel !== "pregameMusic");
      const existing = this.tracks[entry.fileName];
      existing?.sound.stop();
      const sound = existing && existing.preload === preload
        ? existing.sound
        : new WebAudioSound(`/audio/${entry.fileName}.mp3`, preload);
      if (existing && existing.sound !== sound) existing.sound.dispose();
      const track: LoadedTrack = {
        fileName: entry.fileName,
        loop: entry.loop ?? false,
        volume: AudioManager.clamp(entry.volume),
        overrides: entry.overrides ?? false,
        channel, preload, sound,
      };
      this.tracks[entry.fileName] = track;
      sound.volume = track.volume * this.volumes[channel];
      if (preload) {
        try { void sound.preload().catch(() => {}); } catch {}
      }
    }
  }

  play(audioName: string): void {
    const track = this.tracks[audioName];
    if (!track) return;
    if (track.overrides) {
      for (const other of Object.values(this.tracks)) {
        if (other.overrides) other.sound.stop();
      }
    }
    try { void track.sound.play(track.loop).catch(() => {}); } catch {}
  }

  stop(audioName?: string): void {
    if (audioName != null) this.tracks[audioName]?.sound.stop();
    else {
      for (const track of Object.values(this.tracks)) {
        if (track.channel !== "important") track.sound.stop();
      }
    }
  }

  stopMany(audioNames: string[]): void {
    if (Array.isArray(audioNames)) audioNames.forEach((name) => this.stop(name));
  }

  async playUrls(urls: string[], volume: () => number): Promise<void> {
    const generation = this.generation;
    for (const url of urls) {
      if (generation !== this.generation) return;
      if (typeof url !== "string" || !url.length) continue;
      const sound = new WebAudioSound(url, false);
      sound.volume = volume();
      this.transientSounds.add(sound);
      // Invalid files or suspended mobile playback must not stall the queue.
      const timeout = setTimeout(() => sound.dispose(), 6000);
      try { await sound.play(); } catch {}
      finally {
        clearTimeout(timeout);
        sound.dispose();
        this.transientSounds.delete(sound);
      }
    }
  }

  dispose(): void {
    this.generation++;
    for (const track of Object.values(this.tracks)) track.sound.dispose();
    for (const sound of this.transientSounds) sound.dispose();
    this.transientSounds.clear();
    this.tracks = {};
  }

  syncVolume(sfx: number, music: number, pregameMusic: number, important: number): void {
    this.volumes = {
      sfx: AudioManager.clamp(sfx), music: AudioManager.clamp(music),
      pregameMusic: AudioManager.clamp(pregameMusic), important: AudioManager.clamp(important),
    };
    for (const track of Object.values(this.tracks)) {
      track.sound.volume = track.volume * this.volumes[track.channel];
    }
  }

  get loadedNames(): string[] { return Object.keys(this.tracks); }
}
