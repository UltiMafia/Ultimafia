// All of one user's open chat sockets (several tabs, or the homepage chatbox
// and the floating DM window at once). send() fans out to every socket, so
// code that did `users[id].send(...)` with a single socket keeps working.
class SocketGroup {
  constructor() {
    this.sockets = new Set();
  }

  add(socket) {
    this.sockets.add(socket);
  }

  remove(socket) {
    this.sockets.delete(socket);
  }

  has(socket) {
    return this.sockets.has(socket);
  }

  get size() {
    return this.sockets.size;
  }

  send(...args) {
    for (const socket of this.sockets) socket.send(...args);
  }

  sendExcept(except, ...args) {
    for (const socket of this.sockets) if (socket !== except) socket.send(...args);
  }
}

// map[key] is a SocketGroup; drop the entry once it is empty.
function addSocket(map, key, socket) {
  if (!map[key]) map[key] = new SocketGroup();
  map[key].add(socket);
}

function removeSocket(map, key, socket) {
  const group = map && map[key];
  if (!group) return;
  group.remove(socket);
  if (group.size === 0) delete map[key];
}

module.exports = { SocketGroup, addSocket, removeSocket };
