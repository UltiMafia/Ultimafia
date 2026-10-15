import { registerSocket, unregisterSocket, setSocketState } from "./lib/connectionStatus.js";

const PING_INTERVAL = 10000;
export const MAX_REPLAY_MESSAGES = 1024;
let nextSocketId = 0;

class Socket {
  constructor(socket) {
    this.listeners = {};
    this.sendQueue = [];
    this.received = [];
    this.id = `socket-${++nextSocketId}`;
    this.disposed = false;
    this.nativeListeners = [];
    this.setSocket(socket);
  }

  listen(socket, event, callback) {
    const guarded = (...args) => {
      if (!this.disposed && this.socket === socket) callback(...args);
    };
    socket.addEventListener(event, guarded);
    this.nativeListeners.push({ socket, event, callback: guarded });
  }

  detachSocket() {
    for (const { socket, event, callback } of this.nativeListeners) {
      socket.removeEventListener(event, callback);
    }
    this.nativeListeners = [];
  }

  setSocket(socket) {
    if (this.disposed) {
      socket.close();
      return;
    }
    const previous = this.socket;
    this.detachSocket();
    this.socket = socket;
    if (previous && previous !== socket) previous.close();
    this.received = [];
    registerSocket(this.id);

    this.listen(socket, "message", (event) => {
      const parsed = parseMessage(event.data);
      if (!parsed) return;
      const [eventName, data] = parsed;
      this.triggerEvent(eventName, data);
      // Application state retains full chat/history. This is only a bounded
      // catch-up buffer for subscribers mounted after an initial delivery.
      if (!this.disposed && eventName !== "p") {
        this.received.push({ eventName, data });
        if (this.received.length > MAX_REPLAY_MESSAGES) this.received.shift();
      }
    });
    this.listen(socket, "open", () => {
      setSocketState(this.id, "open");
      const queue = this.sendQueue;
      this.sendQueue = [];
      for (const message of queue) socket.send(message);
    });
    this.listen(socket, "close", () => {
      setSocketState(this.id, "closed");
      this.triggerEvent("disconnected");
    });
    this.listen(socket, "error", () => this.terminate());
  }

  triggerEvent(eventName, data) {
    if (this.disposed) return;
    // A listener can unsubscribe during delivery without skipping its sibling.
    for (const action of [...(this.listeners[eventName] || [])]) {
      if (this.disposed) break;
      action(data);
    }
  }

  on(eventName, action, { replay = true } = {}) {
    if (this.disposed) return null;
    const bound = action.bind(this);
    const actions = this.listeners[eventName] || (this.listeners[eventName] = []);
    actions.push(bound);
    try {
      for (const message of replay ? [...this.received] : []) {
        if (this.disposed || !actions.includes(bound)) break;
        if (message.eventName === eventName) bound(message.data);
      }
    } catch (error) {
      this.off(eventName, bound);
      throw error;
    }
    return bound;
  }

  off(eventName, action) {
    const actions = this.listeners[eventName];
    const index = actions?.indexOf(action) ?? -1;
    if (index !== -1) actions.splice(index, 1);
    if (actions && actions.length === 0) delete this.listeners[eventName];
  }

  send(eventName, data) {
    if (this.disposed || !this.socket) return;
    const message = stringifyMessage(eventName, data);
    if (this.socket.readyState === 0) this.sendQueue.push(message);
    else if (this.socket.readyState === 1) this.socket.send(message);
  }

  clearListeners() {
    this.listeners = this.listeners.p ? { p: this.listeners.p } : {};
  }

  terminate() {
    if (this.socket) this.socket.close();
  }

  get readyState() {
    return this.socket ? this.socket.readyState : 3;
  }
}

export class ClientSocket extends Socket {
  constructor(path, persistent) {
    super(new WebSocket(path));
    this.path = path;
    this.persistent = persistent;
    this.configurePing();
    this.configureClose();
  }

  reconnect() {
    if (this.disposed) return;
    clearTimeout(this.pingTimeout);
    super.setSocket(new WebSocket(this.path));
    this.heartbeat();
    this.configureClose();
  }

  configurePing() {
    this.heartbeat();
    this.on("p", () => this.heartbeat());
  }

  heartbeat() {
    clearTimeout(this.pingTimeout);
    if (this.disposed) return;
    this.send("p");
    const socket = this.socket;
    this.pingTimeout = setTimeout(() => {
      if (!this.disposed && this.socket === socket) socket.close();
    }, PING_INTERVAL + 1000);
  }

  configureClose() {
    this.listen(this.socket, "close", () => {
      if (this.persistent) this.reconnect();
    });
  }

  clear() {
    if (this.disposed) return;
    this.disposed = true;
    this.persistent = false;
    clearTimeout(this.pingTimeout);
    this.detachSocket();
    unregisterSocket(this.id);
    this.listeners = {};
    this.sendQueue = [];
    this.received = [];
    const socket = this.socket;
    this.socket = null;
    if (socket) socket.close();
  }
}

// Register component-owned handlers without changing existing callbacks' API.
// All socket methods still run with the real socket as `this`.
export function subscribeSocketListeners(socket, register, { replay = true } = {}) {
  if (!socket?.on) return () => {};
  const subscriptions = [];
  const cleanup = () => {
    for (const [event, handler] of subscriptions.splice(0)) socket.off(event, handler);
  };
  const scoped = new Proxy(socket, {
    get(target, key) {
      if (key === "on") return (event, callback) => {
        const handler = target.on(event, callback, { replay });
        subscriptions.push([event, handler]);
        return handler;
      };
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  try {
    const additionalCleanup = register(scoped);
    // An expression-bodied registration may return socket.on's handler. That
    // is not a disposer and must never be invoked as one during unmount.
    const returnedHandler = subscriptions.some(([, handler]) => handler === additionalCleanup);
    let disposed = false;
    return () => {
      if (disposed) return;
      disposed = true;
      cleanup();
      if (typeof additionalCleanup === "function" && !returnedHandler) additionalCleanup();
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function stringifyMessage(eventName, data) {
  const type = typeof data;
  if (type === "undefined") return eventName;
  if (type === "object") data = JSON.stringify(data);
  else if (type !== "string") data = String(data);
  return `${eventName}:${type}:${data}`;
}

export function parseMessage(message) {
  if (typeof message !== "string") return;
  let split = message.split(/:(.*)/s);
  const eventName = split[0];
  if (split.length < 2) return [eventName];
  split = split[1].split(/:(.*)/s);
  if (split.length < 2) return;
  const type = split[0];
  let data = split[1];
  if (type === "number") data = Number(data);
  else if (type === "boolean") data = data !== "false";
  else if (type === "object") {
    try { data = JSON.parse(data); } catch (_) { return; }
  }
  return [eventName, data];
}
