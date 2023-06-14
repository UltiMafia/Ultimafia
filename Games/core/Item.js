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
    this.lifespan = Infinity;
    this.ageListener;

    if (data) for (const key in data) this[key] = data[key];
  }

  hold(player) {
    this.game = player.game;
    this.holder = player;
    this.holder.items.push(this);

    this.applyEffects();

    this.ageListener = this.age.bind(this);
    this.game.events.on("state", this.ageListener);

    for (const eventName in this.listeners) {
      this.listeners[eventName] = this.listeners[eventName].bind(this);
      this.game.events.on(eventName, this.listeners[eventName]);
    }

    this.game.events.emit("holdItem", this, player);
  }

  drop() {
    const itemArr = this.holder.items;
    itemArr.splice(itemArr.indexOf(this), 1);

    this.game.events.removeListener("state", this.ageListener);

    for (const eventName in this.listeners)
      this.holder.events.removeListener(eventName, this.listeners[eventName]);

    this.removeEffects();
  }

  shouldDisableMeeting(name, options) {
    return false;
  }

  applyEffects() {
    if (typeof this.effects[0] !== "string") return;

    this.effectNames = [];

    for (const i in this.effects) {
      const effectName = this.effects[i];
      this.effectNames.push(effectName);
      this.effects[i] = this.holder.giveEffect(effectName);
    }
  }

  removeEffects() {
    if (typeof this.effects[0] !== "object") return;

    for (const effect of this.effects) effect.remove();

    this.effects = this.effectNames;
  }

  queueActions() {
    for (const action of this.actions) this.game.queueAction(action);
  }

  dequeueActions() {
    for (const action of this.actions) this.game.dequeueAction(action);
  }

  age() {
    this.lifespan--;

    if (this.lifespan < 0) this.drop();
  }

  speak(message) {}

  hear(message) {}

  seeVote(vote) {}
};
