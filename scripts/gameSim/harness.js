const shortid = require("shortid");
const User = require("../../Games/core/User");
const Socket = require("../../lib/sockets").TestSocket;

function makeUsers(amount) {
  const users = [];
  for (let i = 0; i < amount; i++)
    users.push(
      new User({
        id: shortid.generate(),
        socket: new Socket(),
        name: `bot${i}`,
        settings: {},
        isTest: true,
      })
    );
  return users;
}

class FrameMeter {
  constructor() {
    this.frames = 0;
    this.bytes = 0;
    this.byEvent = {};
  }

  watch(socket) {
    const send = socket.send.bind(socket);
    socket.send = (eventName, data) => {
      const size = Buffer.byteLength(JSON.stringify([eventName, data]) || "");
      this.frames += 1;
      this.bytes += size;
      const entry = (this.byEvent[eventName] ||= { frames: 0, bytes: 0 });
      entry.frames += 1;
      entry.bytes += size;
      return send(eventName, data);
    };
  }

  reset() {
    this.frames = 0;
    this.bytes = 0;
    this.byEvent = {};
  }

  snapshot() {
    return { frames: this.frames, bytes: this.bytes, byEvent: { ...this.byEvent } };
  }
}

async function makeGame(GameClass, { players, setup, settings }) {
  const users = makeUsers(players);
  const meter = new FrameMeter();
  for (const user of users) meter.watch(user.socket);
  const game = new GameClass({
    id: shortid.generate(),
    hostId: users[0].id,
    settings: { pregameCountdownLength: 0, ...settings, setup },
    isTest: true,
  });
  await game.init();
  for (const user of users) await game.userJoin(user);
  return { game, users, meter };
}

function waitFor(check, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const interval = setInterval(() => {
      try {
        if (check()) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - started > timeoutMs) {
          clearInterval(interval);
          reject(new Error("timed out"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    }, 5);
  });
}

function meetingOf(player, name) {
  return player
    .getMeetings()
    .find((m) => m.name == name && (!m.finished || m.repeatable));
}

function vote(player, meeting, selection) {
  player.user.socket.sendToServer("vote", { meetingId: meeting.id, selection });
}

function seedChat(game, meetingName, count) {
  const speakers = game.players.array().filter((p) => p.alive);
  for (let i = 0; i < count; i++) {
    const player = speakers[i % speakers.length];
    const meeting = meetingOf(player, meetingName);
    meeting.speak({
      sender: player,
      content: `seed message ${i} with some ordinary table talk`,
      meetingId: meeting.id,
    });
  }
}

module.exports = { makeGame, waitFor, meetingOf, vote, seedChat, FrameMeter };
