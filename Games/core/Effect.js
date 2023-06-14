const shortid = require("shortid");

module.exports = class Effect {
  constructor(name) {
    this.id = shortid.generate();
    this.name = name;
    this.immunity = {};
    this.cancelImmunity = {};
    this.actions = [];
    this.listeners = {};
    this.disabledMeetings = [];
    this.lifespan = Infinity;
    this.ageListener;
  }

  apply(player) {
    this.game = player.game;
    this.player = player;
    this.player.effects.push(this);

    this.ageListener = this.age.bind(this);
    this.game.events.on("state", this.ageListener);

    for (const eventName in this.listeners) {
      this.listeners[eventName] = this.listeners[eventName].bind(this);
      this.game.events.on(eventName, this.listeners[eventName]);
    }

    this.game.events.emit("applyEffect", this, player);
  }

  remove() {
    const index = this.player.effects.indexOf(this);

    if (index != -1) this.player.effects.splice(index, 1);

    for (const meeting of this.disabledMeetings) meeting.disabled = false;

    this.game.events.removeListener("state", this.ageListener);

    for (const eventName in this.listeners)
      this.player.events.removeListener(eventName, this.listeners[eventName]);
  }

  shouldDisableMeeting(meeting) {
    return false;
  }

  queueActions() {
    for (const action of this.actions) this.game.queueAction(action);
  }

  dequeueActions() {
    for (const action of this.actions) this.game.dequeueAction(action);
  }

  getImmunity(type) {
    let immunity = this.immunity[type];
    if (immunity == null) immunity = 0;
    return immunity;
  }

  age() {
    this.lifespan--;

    if (this.lifespan < 0) this.remove();
  }

  speak(message) {}

  speakQuote(quote) {}

  hear(message) {}

  hearQuote(quote) {}

  seeVote(vote) {}

  seeUnvote(info) {}

  seeTyping(info) {}
};
