// Use buffer sources directly: HTML media elements expose game audio through
// OS media controls, even when connected to a Web Audio graph.
let context: AudioContext | undefined;

export function getAudioContext(): AudioContext {
  if (!context || context.state === "closed") {
    const AudioContextClass = window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is unavailable");
    context = new AudioContextClass();
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    try {
      if (nav.audioSession) nav.audioSession.type = "ambient";
    } catch {}
  }
  return context;
}

// Resume synchronously from a gesture, including after mobile interruptions.
if (typeof document !== "undefined") {
  const unlock = () => {
    if (context && context.state !== "running") void context.resume().catch(() => {});
  };
  for (const event of ["pointerdown", "touchend", "keydown", "click"]) {
    document.addEventListener(event, unlock, { capture: true, passive: true });
  }
}

export default class WebAudioSound {
  private buffer?: AudioBuffer;
  private loading?: Promise<AudioBuffer>;
  private controller?: AbortController;
  private source?: AudioBufferSourceNode;
  private gain?: GainNode;
  private finish?: () => void;
  private version = 0;
  private level = 1;

  constructor(private input: string | AudioBuffer, private retainBuffer = true) {
    if (typeof input !== "string") this.buffer = input;
  }

  set volume(value: number) {
    this.level = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
    if (this.gain) this.gain.gain.value = this.level;
  }

  preload(): Promise<AudioBuffer> {
    if (this.buffer) return Promise.resolve(this.buffer);
    if (this.loading) return this.loading;
    const ctx = getAudioContext();
    const controller = new AbortController();
    this.controller = controller;
    const loading = fetch(this.input as string, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((buffer) => {
        if (controller.signal.aborted) throw new Error("Audio load cancelled");
        this.buffer = buffer;
        return buffer;
      })
      .finally(() => {
        if (this.loading === loading) this.loading = undefined;
      });
    this.loading = loading;
    return loading;
  }

  // Resolves when playback ends or is stopped, for sequential death sounds.
  play(loop = false): Promise<void> {
    this.stop();
    const version = this.version;
    const ctx = getAudioContext();
    // Call resume before any await so a caller's user activation is retained.
    const resumed = ctx.state === "running" ? Promise.resolve() : ctx.resume();
    return new Promise<void>((resolve, reject) => {
      this.finish = resolve;
      Promise.all([this.preload(), resumed]).then(([buffer]) => {
        if (version !== this.version) return;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        source.buffer = buffer;
        source.loop = loop;
        gain.gain.value = this.level;
        source.connect(gain);
        gain.connect(ctx.destination);
        this.source = source;
        this.gain = gain;
        source.onended = () => {
          if (this.source === source) this.stop();
        };
        source.start();
      }).catch((error) => {
        if (version !== this.version) return;
        this.finish = undefined;
        this.stop();
        reject(error);
      });
    });
  }

  stop(): void {
    this.version++;
    if (this.source) {
      this.source.onended = null;
      this.source.stop();
      this.source.disconnect();
      this.source = undefined;
    }
    this.gain?.disconnect();
    this.gain = undefined;
    this.finish?.();
    this.finish = undefined;
    if (!this.retainBuffer) {
      this.controller?.abort();
      this.loading = undefined;
      this.buffer = undefined;
    }
  }

  dispose(): void {
    this.stop();
    this.controller?.abort();
    this.loading = undefined;
    this.buffer = undefined;
  }
}
