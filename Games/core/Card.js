module.exports = class Card {
  constructor(role) {
    this.role = role;

    this.appearance = {};
    this.hideModifier = {};
    this.oblivious = {};
    this.actions = [];
    this.startItems = [];
    this.startEffects = [];
    this.immunity = {};
    this.cancelImmunity = {};
    this.meetings = {};
    this.listeners = {};
    this.stealableListeners = {};
    this.stateMods = {};
    this.meetingMods = {};
    this.overwrites = {
      /* 
            winCount, 
            winCheck, 
            appearance, 
            hideModifier,
            oblivious, 
            actions, 
            startItems, 
            startEffects, 
            immunity, 
            cancelImmunity, 
            meetings, 
            stealableListeners,
            stateMods,
        */
    };
  }

  init() {
    const attributes = [
      "winCount",
      "winCheck",
      "appearance",
      "hideModifier",
      "oblivious",
      "actions",
      "startItems",
      "startEffects",
      "immunity",
      "cancelImmunity",
      "visit",
      "meetings",
      "listeners",
      "stealableListeners",
      "stateMods",
      "meetingMods",
    ];

    for (const key of attributes) {
      if (Array.isArray(this[key])) {
        if (this.overwrites[key]) this.role[key] = this[key];
        else this.role[key] = this.role[key].concat(this[key]);
      } else if (key == "listeners") {
        for (const eventName in this.listeners) {
          if (!this.role.listeners[eventName])
            this.role.listeners[eventName] = [];

          this.role.listeners[eventName].push(this.listeners[eventName]);
        }
      } else if (this[key] && typeof this[key] === "object") {
        if (this.overwrites[key]) this.role[key] = this[key];
        else {
          for (const prop in this[key]) this.role[key][prop] = this[key][prop];
        }
      } else if (this[key]) this.role[key] = this[key];
    }

    /*
            Overwrites
            ---------
            Array: Replace on overwrite, concat otherwise
            Object, Replace on overwrite, set individual properties otherwise
            Listeners: No overwrite option
            Properties: Always overwrite
        */
  }

  speak(message) {}

  speakQuote(quote) {}

  hear(message) {}

  hearQuote(quote) {}

  seeVote(vote) {}

  seeUnvote(info) {}

  seeTyping(info) {}
};
