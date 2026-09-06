const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../react_main/node_modules/typescript");

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));

function harness() {
  const sources = [];
  const gains = [];
  const requests = [];
  const listeners = {};
  const ctx = {
    state: "running", destination: {},
    resume: async () => { ctx.state = "running"; },
    decodeAudioData: async () => ({ duration: 2 }),
    createBufferSource: () => {
      const source = {
        connect() {}, disconnect() {},
        start() { this.started = true; },
        stop() { this.stopped = true; },
      };
      sources.push(source);
      return source;
    },
    createGain: () => {
      const gain = { gain: { value: 1 }, connect() {}, disconnect() {} };
      gains.push(gain);
      return gain;
    },
  };
  const globals = {
    window: { AudioContext: function () { return ctx; } },
    navigator: { audioSession: {} },
    document: { addEventListener: (event, fn) => { listeners[event] = fn; } },
    AbortController, setTimeout, clearTimeout,
    fetch: (url, options) => {
      const request = deferred();
      requests.push({ url, options, ...request });
      return request.promise;
    },
  };
  const modules = {};
  function load(name) {
    const filename = path.join(__dirname, "../react_main/src/audio", `${name}.ts`);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const exports = {};
    vm.runInNewContext(code, { ...globals, exports, require: (id) => modules[id] }, { filename });
    modules[`./${name}`] = exports;
    return exports.default;
  }
  const Sound = load("WebAudioSound");
  const Manager = load("AudioManager");
  const respond = (index) => requests[index].resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
  return { Sound, Manager, ctx, sources, gains, requests, respond, listeners };
}

describe("Web Audio game playback", function () {
  it("cancels a stopped sound while decoding and never starts it late", async function () {
    const h = harness();
    const decode = deferred();
    h.ctx.decodeAudioData = () => decode.promise;
    const sound = new h.Sound("/ping.mp3");
    const playing = sound.play();
    h.respond(0);
    await flush();
    sound.stop();
    await playing;
    decode.resolve({ duration: 2 });
    await flush();
    assert.equal(h.sources.length, 0);
  });

  it("only starts the latest replay and applies live volume and looping", async function () {
    const h = harness();
    const sound = new h.Sound("/ping.mp3");
    const first = sound.play();
    const second = sound.play(true);
    await first;
    assert.equal(h.requests.length, 1);
    h.respond(0);
    await flush();
    assert.equal(h.sources.length, 1);
    assert.equal(h.sources[0].loop, true);
    sound.volume = 0.25;
    assert.equal(h.gains[0].gain.value, 0.25);
    sound.stop();
    await second;
    assert.equal(h.sources[0].stopped, true);
  });

  it("rejects failures and allows retry", async function () {
    const h = harness();
    const sound = new h.Sound("/bad.mp3");
    const failed = assert.rejects(sound.play(), /Audio request failed/);
    h.requests[0].resolve({ ok: false, status: 404 });
    await failed;
    const playing = sound.play();
    h.respond(1);
    await flush();
    h.sources[0].onended();
    await playing;
  });

  it("resumes on gestures and cancels pending playback before unlock", async function () {
    const h = harness();
    const resumed = deferred();
    h.ctx.state = "suspended";
    let resumes = 0;
    h.ctx.resume = () => { resumes++; return resumed.promise; };
    const sound = new h.Sound("/ping.mp3");
    const playing = sound.play();
    h.respond(0);
    h.listeners.pointerdown();
    assert.equal(resumes, 2);
    sound.stop();
    await playing;
    resumed.resolve();
    await flush();
    assert.equal(h.sources.length, 0);
  });

  it("loads music lazily, honors overrides, and releases music on stop", async function () {
    const h = harness();
    const manager = new h.Manager();
    manager.load([
      { fileName: "ping" },
      { fileName: "music/one", loop: true, overrides: true },
      { fileName: "music/two", overrides: true },
    ]);
    assert.equal(h.requests.length, 1);
    manager.syncVolume(1, 0.4, 1, 1);
    manager.play("music/one");
    h.respond(1);
    await flush();
    assert.equal(h.gains[0].gain.value, 0.4);
    manager.play("music/two");
    assert.equal(h.sources[0].stopped, true);
    manager.stop("music/two");
    h.respond(2);
    await flush();
    assert.equal(h.sources.length, 1);
    manager.play("music/one");
    assert.equal(h.requests.length, 4);
    manager.dispose();
  });

  it("preserves important alerts on stop-all but cancels everything on disposal", async function () {
    const h = harness();
    const manager = new h.Manager();
    manager.load([{ fileName: "bell", channel: "important" }, { fileName: "ping" }]);
    manager.play("bell");
    manager.play("ping");
    h.respond(0);
    h.respond(1);
    await flush();
    manager.stop();
    assert.equal(h.sources[0].stopped, undefined);
    assert.equal(h.sources[1].stopped, true);
    manager.dispose();
    assert.equal(h.sources[0].stopped, true);
  });

  it("sequences custom sounds and cancels the remaining queue on unmount", async function () {
    const h = harness();
    const manager = new h.Manager();
    const playing = manager.playUrls(["/a", "/b", "/c"], () => 0.3);
    h.respond(0);
    await flush();
    assert.equal(h.requests.length, 1);
    assert.equal(h.gains[0].gain.value, 0.3);
    h.sources[0].onended();
    await flush();
    assert.equal(h.requests.length, 2);
    manager.dispose();
    await playing;
    h.respond(1);
    await flush();
    assert.equal(h.sources.length, 1);
    assert.equal(h.requests.length, 2);
  });
});
