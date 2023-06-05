const WebSocket = require("ws");

class SocketServer {
  constructor(data) {
    if (typeof data == "string" || typeof data == "number")
      this.server = new WebSocket.Server({ port: data });
    else this.server = new WebSocket.Server({ server: data });

    this.configurePing();
  }

  configurePing() {
    clearInterval(this.pingInterval);

    // Ping real clients
    this.pingInterval = setInterval(() => {
      this.server.clients.forEach((client) => {
        if (client.isServer) return;

        if (!client.isAlive) {
          client.terminate();
          return;
        }

        client.isAlive = false;
        client.send("p");
      });
    }, Number(process.env.SOCKET_PING_INTERVAL));

    // Ping server clients
    this.pingInterval = setInterval(() => {
      this.server.clients.forEach((client) => {
        if (!client.isServer) return;

        if (!client.isAlive) {
          client.terminate();
          return;
        }

        client.isAlive = false;
        client.send("p");
      });
    }, Number(process.env.SERVER_SOCKET_PING_INTERVAL));
  }

  on(eventName, action) {
    if (eventName == "connection") {
      this.server.on("connection", (socket) => {
        action(new ServerSocket(socket));
      });
    }
  }

  broadcast(eventName, data) {
    const message = stringifyMessage(eventName, data);

    for (let i = 0; i < this.server.clients.length; i++)
      this.server.clients[i].send(message);
  }
}

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

    this.socket.on("open", () => {
      this.received = [];

      for (let message of this.sendQueue) this.socket.send(message);
    });

    this.socket.on("close", () => {
      this.triggerEvent("disconnected");
    });

    this.socket.on("error", () => {
      this.terminate();
    });
  }

  configureListeners() {
    this.socket.on("message", (message) => {
      const [eventName, data] = parseMessage(message);
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

    for (let message of this.received)
      if (message.eventName == eventName) action(message.data);
  }

  send(eventName, data) {
    const message = stringifyMessage(eventName, data);

    if (this.socket.readyState == 0) this.sendQueue.push(message);
    else if (this.socket.readyState == 1) this.socket.send(message);
  }

  clearListeners() {
    var newListeners = {};
    newListeners["p"] = this.listeners["p"];
    this.listeners = newListeners;
  }

  terminate() {
    this.socket.terminate();
  }

  get readyState() {
    if (this.socket) return this.socket.readyState;
    else return 3;
  }
}

class ServerSocket extends Socket {
  constructor(socket) {
    super(socket);

    this.configurePong();
  }

  configurePong() {
    this.socket.isAlive = true;
    this.on("p", () => {
      this.socket.isAlive = true;
    });
  }

  get isServer() {
    if (this.socket) return this.socket.isServer;
    else return false;
  }

  set isServer(val) {
    if (this.socket) this.socket.isServer = val;
  }
}

class ClientSocket extends Socket {
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
      this.socket.terminate();
    }, Number(process.env.SERVER_SOCKET_PING_INTERVAL) + 1000);
  }

  configureClose() {
    this.socket.on("close", () => {
      if (this.persistent) this.reconnect();
    });
  }

  clear() {
    clearTimeout(this.pingTimeout);

    this.persistent = false;
    this.listeners = {};
    this.sendQueue = [];

    if (this.socket) this.socket.terminate();

    this.socket = null;
  }
}

class TestSocket {
  constructor() {
    this.listeners = {};
    this.clientListeners = {};
    this.clientMessages = [];
  }

  flushMessages() {
    this.clientMessages = [];
  }

  on(eventName, action) {
    if (!this.listeners[eventName]) this.listeners[eventName] = [];

    this.listeners[eventName].push(action.bind(this));
  }

  onClientEvent(eventName, action) {
    if (!this.clientListeners[eventName]) this.clientListeners[eventName] = [];

    action = action.bind(this);
    this.clientListeners[eventName].push(action);

    for (let message of this.clientMessages)
      if (message.eventName == eventName) action(message.data);
  }

  send(eventName, data) {
    this.clientMessages.push({ eventName, data });
    var actions = this.clientListeners[eventName];

    if (!actions) return;

    for (let action of actions) action(data);
  }

  sendToServer(eventName, data) {
    var actions = this.listeners[eventName];

    if (!actions) return;

    for (let action of actions) action(data);
  }

  terminate() {
    this.listeners = {};
    this.clientMessages.push({ eventName: "terminate" });
  }

  lastMessage() {
    return this.clientMessages[this.clientMessages.length - 1];
  }
}

function stringifyMessage(eventName, data) {
  const type = typeof data;

  if (type == "undefined") return eventName;

  if (type == "object") data = JSON.stringify(data);
  else if (type != "string") data = String(data);

  return `${eventName}:${type}:${data}`;
}

function parseMessage(message) {
  var split = message.split(/:(.*)/s);
  const eventName = split[0];

  if (split.length < 2) return [eventName];

  split = split[1].split(/:(.*)/s);

  if (split.length < 2) return;

  const type = split[0];
  var data = split[1];

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

module.exports = {
  SocketServer,
  ServerSocket,
  ClientSocket,
  TestSocket,
  stringifyMessage,
  parseMessage,
};
