const PING_INTERVAL = 10000;

class Socket {
  constructor(socket) {
    this.listeners = {};
    this.sendQueue = [];
    this.received = [];

    this.setSocket(socket);
  }

  setSocket(socket) {
    this.socket = socket;

    this.configureListeners();

    this.socket.addEventListener("open", () => {
      this.received = [];

      for (const message of this.sendQueue) this.socket.send(message);
    });

    this.socket.addEventListener("close", () => {
      this.triggerEvent("disconnected");
    });

    this.socket.addEventListener("error", () => {
      this.terminate();
    });
  }

  configureListeners() {
    this.socket.addEventListener("message", (message) => {
      const [eventName, data] = parseMessage(message.data);
      this.triggerEvent(eventName, data);
      this.received.push({ eventName, data });
    });
  }

  triggerEvent(eventName, data) {
    const actions = this.listeners[eventName];

    if (!actions) return;

    for (let i = 0; i < actions.length; i++) actions[i](data);
  }

  on(eventName, action) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];

    action = action.bind(this);
    this.listeners[eventName].push(action);

    for (const message of this.received)
      if (message.eventName == eventName) action(message.data);
  }

  send(eventName, data) {
    const message = stringifyMessage(eventName, data);

    if (this.socket.readyState == 0) this.sendQueue.push(message);
    else if (this.socket.readyState == 1) this.socket.send(message);
  }

  clearListeners() {
    const newListeners = {};
    newListeners.p = this.listeners.p;
    this.listeners = newListeners;
  }

  terminate() {
    this.socket.close();
  }

  get readyState() {
    if (this.socket) return this.socket.readyState;
    return 3;
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
    this.send("p");

    this.pingTimeout = setTimeout(() => {
      this.socket.close();
    }, PING_INTERVAL + 1000);
  }

  configureClose() {
    this.socket.addEventListener("close", () => {
      if (this.persistent) this.reconnect();
    });
  }

  clear() {
    clearTimeout(this.pingTimeout);

    this.persistent = false;
    this.listeners = {};
    this.sendQueue = [];

    if (this.socket) this.socket.close();

    this.socket = null;
  }
}

export function stringifyMessage(eventName, data) {
  const type = typeof data;

  if (type == "undefined") return eventName;

  if (type == "object") data = JSON.stringify(data);
  else if (type != "string") data = String(data);

  return `${eventName}:${type}:${data}`;
}

export function parseMessage(message) {
  let split = message.split(/:(.*)/s);
  const eventName = split[0];

  if (split.length < 2) return [eventName];

  split = split[1].split(/:(.*)/s);

  if (split.length < 2) return;

  const type = split[0];
  let data = split[1];

  switch (type) {
    case "number":
      data = Number(data);
      break;
    case "boolean":
      data = data != "false";
      break;
    case "object":
      try {
        data = JSON.parse(data);
      } catch (e) {
        return;
      }
      break;
  }

  return [eventName, data];
}
