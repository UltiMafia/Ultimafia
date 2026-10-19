import test from "node:test";
import assert from "node:assert/strict";
import { ClientSocket, MAX_REPLAY_MESSAGES, parseMessage, subscribeSocketListeners } from "../src/Socket.js";
import { getConnectionStatus } from "../src/lib/connectionStatus.js";
import { LatestRequest } from "../src/lib/latestRequest.js";
import { SheetController } from "../src/lib/sheetController.js";
import { browserReservesBottomSafeArea, isIos } from "../src/utils/platform.js";

class FakeWebSocket {
  static sockets = [];
  constructor(path) {
    this.path = path;
    this.readyState = 0;
    this.listeners = new Map();
    this.sent = [];
    this.closes = 0;
    FakeWebSocket.sockets.push(this);
  }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name, event = {}) { for (const callback of [...(this.listeners.get(name) || [])]) callback(event); }
  open() { this.readyState = 1; this.emit("open"); }
  send(message) { this.sent.push(message); }
  close() { this.closes += 1; this.readyState = 3; this.emit("close"); }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

function socketFixture(t, persistent = false) {
  const original = { WebSocket: globalThis.WebSocket, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const timers = new Set();
  FakeWebSocket.sockets = [];
  globalThis.WebSocket = FakeWebSocket;
  globalThis.setTimeout = callback => { timers.add(callback); return callback; };
  globalThis.clearTimeout = callback => timers.delete(callback);
  const socket = new ClientSocket("ws://test.invalid", persistent);
  t.after(() => { socket.clear(); Object.assign(globalThis, original); });
  return { socket, native: socket.socket, timers };
}

test("disposal closes once, cancels heartbeat and unregisters status", t => {
  const { socket, native, timers } = socketFixture(t, true);
  socket.on("event", () => {});
  native.emit("message", {data:'event:number:1'});
  assert.equal(timers.size, 1);
  socket.clear(); socket.clear(); socket.reconnect(); socket.send("ignored");
  assert.equal(native.closes, 1);
  assert.equal(native.listenerCount, 0);
  assert.equal(timers.size, 0);
  assert.deepEqual(socket.received, []);
  assert.deepEqual(socket.sendQueue, []);
  assert.deepEqual(socket.listeners, {});
  assert.equal(socket.readyState, 3);
  assert.equal(getConnectionStatus(), "idle");
  assert.equal(FakeWebSocket.sockets.length, 1);
});

test("already-queued native callbacks and heartbeat are inert after disposal", t => {
  const {socket, native, timers} = socketFixture(t, true);
  const callbacks = [...native.listeners.values()].flatMap(set => [...set]);
  const heartbeat = [...timers][0];
  let calls = 0;
  socket.on("event", () => calls++);
  socket.clear();
  for (const callback of callbacks) callback({data:'event:number:9'});
  heartbeat();
  assert.equal(calls, 0);
  assert.equal(native.closes, 1);
  assert.equal(FakeWebSocket.sockets.length, 1);
  assert.equal(getConnectionStatus(), "idle");
});

test("reconnect detaches the superseded connection and rejects its late events", t => {
  const {socket, native} = socketFixture(t, true);
  const staleMessage = [...native.listeners.get("message")][0];
  const oldHeartbeat = socket.pingTimeout;
  let calls = 0;
  socket.on("event", () => calls++);
  socket.reconnect();
  staleMessage({data:'event:number:1'}); oldHeartbeat();
  assert.equal(calls, 0);
  assert.equal(native.listenerCount, 0);
  assert.equal(socket.socket.closes, 0);
  socket.socket.emit("message", {data:'event:number:2'});
  assert.equal(calls, 1);
});

test("queued sends drain once and are not replayed on reconnect", t => {
  const {socket, native} = socketFixture(t);
  socket.send("action", "one"); native.open();
  assert.deepEqual(native.sent, ['p', 'action:string:one']);
  assert.deepEqual(socket.sendQueue, []);
  socket.reconnect(); socket.socket.open();
  assert.deepEqual(socket.socket.sent, ['p']);
});

test("catch-up buffer is bounded, excludes heartbeat and tolerates malformed messages", t => {
  const {socket, native} = socketFixture(t);
  native.emit("message", {data:'broken:object:{'});
  native.emit("message", {data:'p'});
  for (let i = 0; i < MAX_REPLAY_MESSAGES + 12; i++) native.emit("message", {data:`event:number:${i}`});
  assert.equal(socket.received.length, MAX_REPLAY_MESSAGES);
  assert.equal(socket.received[0].data, 12);
  assert.equal(parseMessage('event:object:{'), undefined);
});

test("component subscriptions remove only their own handlers, including replay failures", t => {
  const {socket, native} = socketFixture(t);
  const seen = [];
  const disposeA = subscribeSocketListeners(socket, scoped => {
    scoped.on('event', function (data) { assert.equal(this, socket); seen.push('a'+data); });
  });
  const disposeB = subscribeSocketListeners(socket, scoped => { scoped.on('event', data => seen.push('b'+data)); });
  disposeA(); disposeA(); native.emit('message', {data:'event:number:1'});
  assert.deepEqual(seen, ['b1']);
  disposeB(); assert.equal(socket.listeners.event, undefined);
  assert.throws(() => subscribeSocketListeners(socket, scoped => scoped.on('event', () => { throw new Error('replay'); })), /replay/);
  assert.equal(socket.listeners.event, undefined);
});

test("disposal inside delivery stops the remaining callbacks", t => {
  const {socket, native} = socketFixture(t);
  let second = false;
  socket.on('event', () => socket.clear());
  socket.on('event', () => { second = true; });
  native.emit('message', {data:'event'});
  assert.equal(second, false);
  assert.deepEqual(socket.received, []);
});

test("replacing handlers on the same transport does not replay previously applied events", t => {
  const {socket,native} = socketFixture(t);
  let count = 0;
  const first = subscribeSocketListeners(socket, scoped => { scoped.on('event',()=>count++); });
  native.emit('message',{data:'event'}); first();
  const second = subscribeSocketListeners(socket, scoped => { scoped.on('event',()=>count++); }, {replay:false});
  assert.equal(count,1);
  native.emit('message',{data:'event'}); assert.equal(count,2);
  second();
});

test("a returned event handler is not accidentally called as an unmount disposer", t => {
  const {socket} = socketFixture(t);
  let calls = 0;
  const dispose = subscribeSocketListeners(socket, scoped => scoped.on('event',()=>calls++));
  dispose(); dispose();
  assert.equal(calls,0);
  assert.equal(socket.listeners.event,undefined);
});

test("latest requests reject out-of-order completion, even if transport ignores abort", async () => {
  const requests = new LatestRequest();
  const first = requests.begin();
  const second = requests.begin();
  let accepted;
  const finish = async (request, value) => { await Promise.resolve(); if (request.isCurrent()) accepted = value; };
  await finish(second, 'new lobby'); await finish(first, 'old lobby');
  assert.equal(accepted, 'new lobby');
  assert.equal(first.signal.aborted, true);
  requests.invalidate();
  assert.equal(second.isCurrent(), false);
});

test("new sheet ownership cancels a pending opener before its response arrives", () => {
  const controller = new SheetController();
  let cancelled = 0;
  const first = controller.reserve(() => cancelled++);
  const second = controller.reserve();
  second.show(() => 'new content');
  assert.equal(first.show(() => 'stale content'), false);
  first.close();
  assert.equal(controller.snapshot.sheet.render(), 'new content');
  assert.equal(controller.snapshot.open, true);
  assert.equal(cancelled, 1);
});

test("owner updates content without reopening, and stale owners cannot update/close", () => {
  const controller = new SheetController();
  const first = controller.reserve(); first.show(() => 'initial');
  assert.equal(first.update(() => 'current props'), true);
  assert.equal(controller.snapshot.sheet.render(), 'current props');
  const second = controller.reserve(); second.show(() => 'replacement');
  assert.equal(first.update(() => 'obsolete props'), false);
  first.close();
  assert.equal(controller.snapshot.sheet.render(), 'replacement');
});

test("navigation/dismissal invalidates pending sheets and preserves content through exit", () => {
  const controller = new SheetController();
  const pending = controller.reserve(); controller.closeCurrent();
  assert.equal(pending.show(() => 'late'), false);
  const sheetRequest = controller.reserve(); sheetRequest.show(() => 'closing content');
  sheetRequest.close(); sheetRequest.close();
  assert.equal(controller.snapshot.open, false);
  assert.equal(controller.snapshot.sheet.render(), 'closing content');
  assert.equal(sheetRequest.show(() => 'resurrected'), false);
  controller.finishExit(); assert.equal(controller.snapshot.sheet, null);
});

test("an old exit callback cannot clear a newly opened sheet", () => {
  const controller = new SheetController();
  const first = controller.reserve(); first.show(() => 'first'); first.close();
  const next = controller.reserve(); next.show(() => 'next');
  controller.finishExit();
  assert.equal(controller.snapshot.sheet.render(), 'next');
  assert.equal(controller.snapshot.open, true);
});

test("platform workaround does not mistake Firefox iOS for Android Gecko", t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  t.after(() => { if (original) Object.defineProperty(globalThis,'navigator',original); else delete globalThis.navigator; });
  for (const [userAgent, platform, touch, reserves, ios] of [
    ['Mozilla/5.0 Android Firefox/128.0','Linux',5,true,false],
    ['Mozilla/5.0 Android Chrome/128.0','Linux',5,false,false],
    ['Mozilla/5.0 iPhone FxiOS/128.0','iPhone',5,false,true],
    ['Mozilla/5.0 iPhone Safari/605.1','iPhone',5,false,true],
    ['Mozilla/5.0 Macintosh Safari/605.1','MacIntel',5,false,true],
  ]) {
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent,platform,maxTouchPoints:touch}});
    assert.equal(browserReservesBottomSafeArea(),reserves);
    assert.equal(isIos(),ios);
  }
});
