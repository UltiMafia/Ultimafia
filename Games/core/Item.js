const shortid = require("shortid");
const Utils = require("./Utils");

module.exports = class Item {
  constructor(name, data) {
    this.id = shortid.generate();
    this.name = name;
    this.holder = null;
    this.effects = [];
    this.actions = [];
    this.meetings = {};
    this.listeners = {};
    this.stateMods = {};
    this.lifespan = Infinity;
    this.ageListener;

    if (data) for (let key in data) this[key] = data[key];
  }

  hold(player) {
    if (this.holder === player && player.items.includes(this)) {
      return;
    }

    if (this.holder && this.holder !== player) {
      this.drop();
    }

    this.game = player.game;
    this.holder = player;

    if (!player.items.includes(this)) {
      player.items.push(this);
    }

    this.applyEffects();

    this.ageListener = this.age.bind(this);
    this.game.events.on("state", this.ageListener);

    for (let eventName in this.listeners) {
      this.listeners[eventName] = this.listeners[eventName].bind(this);
      this.game.events.on(eventName, this.listeners[eventName]);
    }

    this.game.events.emit("holdItem", this, player);

    this.notifyHolderInventoryChange(player);
  }

  drop(nope) {
    const holder = this.holder;

    if (!holder) return;

    const idx = holder.items.indexOf(this);
    if (idx !== -1) {
      holder.items.splice(idx, 1);
    }

    this.holder = null;

    this.game.events.removeListener("state", this.ageListener);

    for (let eventName in this.listeners)
      holder.events.removeListener(eventName, this.listeners[eventName]);

    this.removeEffects();
    if (nope == "No") {
      return;
    }
    this.notifyHolderInventoryChange(holder);
  }

  shouldDisableMeeting(name, options) {
    return false;
  }

  applyEffects() {
    if (typeof this.effects[0] != "string") return;

    this.effectNames = [];

    for (let i in this.effects) {
      let effectName = this.effects[i];
      this.effectNames.push(effectName);
      this.effects[i] = this.holder.giveEffect(effectName);
    }
  }

  removeEffects() {
    if (typeof this.effects[0] != "object") return;

    for (let effect of this.effects) effect.remove();

    this.effects = this.effectNames;
  }

  notifyHolderInventoryChange(holder = this.holder) {
    if (holder && holder.send) {
      holder.send("players", holder.game.getAllPlayerInfo(holder));
    }
  }

  queueActions() {
    for (let action of this.actions) this.game.queueAction(action);
  }

  dequeueActions() {
    for (let action of this.actions) this.game.dequeueAction(action);
  }

  age() {
    this.lifespan--;

    if (this.lifespan < 0) this.drop();
  }

  speak(message) {}

  hear(message) {}

  seeVote(vote) {}
};
