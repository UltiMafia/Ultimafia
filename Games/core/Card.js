module.exports = class Card {
  constructor(role) {
    this.role = role;
    this.game = role.game;

    this.appearance = {};
    this.hideModifier = {};
    this.oblivious = {};
    this.actions = [];
    this.startItems = [];
    this.startEffects = [];
    this.immunity = {};
    this.cancelImmunity = {};
    this.meetings = {};
    this.methods = {};
    this.listeners = {};
    this.copyableListeners = {};
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
            copyableListeners,
            stateMods,
        */
    };
  }

  init() {
    var attributes = [
      "winCount",
      "winCheck",
      "winCheckSpecial",
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
      "copyableListeners",
      "stateMods",
      "meetingMods",
    ];

    for (let key of attributes) {
      if (Array.isArray(this[key])) {
        if (this.overwrites[key]) this.role[key] = this[key];
        else this.role[key] = this.role[key].concat(this[key]);
      } else if (key == "listeners") {
        for (let eventName in this.listeners) {
          if (!this.role.listeners[eventName])
            this.role.listeners[eventName] = [];

          this.role.listeners[eventName].push(this.listeners[eventName]);
        }
      } else if (key == "meetingMods") {
        for (let prop in this[key]) {
          if (prop != "*") {
            this.role[key][prop] = this[key][prop];
          } else if (!this.role[key]["*"]) {
            this.role[key][prop] = this[key][prop];
          } else {
            let thing = "*" + this.role.name + "*";
            for (let x = 0; x < 25; x++) {
              if (!this.role[key][thing]) {
                this.role[key][thing] = this[key][prop];
              } else {
                thing += "*";
              }
            }
          }
        }
      } else if (this[key] && typeof this[key] == "object") {
        if (this.overwrites[key]) this.role[key] = this[key];
        else {
          for (let prop in this[key]) this.role[key][prop] = this[key][prop];
        }
      } else {
        if (this[key]) this.role[key] = this[key];
      }
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
