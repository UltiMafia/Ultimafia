const logger = require("../../modules/logging")("games");

module.exports = class Timer {
  constructor(options) {
    this.name = options.name;
    this.then = options.then;
    this.delay = options.delay;
    this.done = false;
    this.game = options.game;
    this.originalClients = options.clients;
    this.syncPeriod = options.syncPeriod || 10000;
  }

  start() {
    clearTimeout(this.timeout);
    clearInterval(this.syncInterval);

    this.timeout = setTimeout(() => {
      try {
        this.end();
      } catch (e) {
        logger.error(e);
      }
    }, this.delay);

    this.syncInterval = setInterval(() => {
      try {
        this.sync();
      } catch (e) {
        logger.error(e);
      }
    }, this.syncPeriod);

    this.startTime = Date.now();
    this.sendInfoToAll();
  }

  timePassed() {
    return Date.now() - this.startTime;
  }

  timeLeft() {
    return this.delay - this.timePassed();
  }

  clear() {
    clearTimeout(this.timeout);
    clearInterval(this.syncInterval);

    this.done = true;

    for (const client of this.clients) client.send("clearTimer", this.name);
  }

  end() {
    if (this.done) return;
    this.clear();
    this.then();
  }

  restart() {
    this.done = false;
    this.start();
  }

  extend(length) {
    this.delay = this.timeLeft() + length;
    this.restart();
  }

  sendInfoToClient(client) {
    client.send("timerInfo", {
      name: this.name,
      delay: this.delay,
    });
  }

  sendInfoToAll() {
    for (const client of this.clients) {
      client.send("timerInfo", {
        name: this.name,
        delay: this.delay,
      });
    }
  }

  sync() {
    for (const client of this.clients) {
      client.send("time", {
        name: this.name,
        time: this.timePassed(),
      });
    }
  }

  syncClient(client) {
    if (this.clients.indexOf(client) == -1) return;

    client.send("time", {
      name: this.name,
      time: this.timePassed(),
    });
  }

  get clients() {
    if (this.originalClients) return this.originalClients;
    return this.game.players.array().concat(this.game.spectators);
  }
};
