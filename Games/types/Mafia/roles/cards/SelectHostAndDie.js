const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const { PRIORITY_REDIRECT_ACTION } = require("../../const/Priority");
const Player = require("../../../../core/Player");

module.exports = class SelectHostAndDie extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Infest Player": {
        actionName: "Infest Player",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["absolute"],
          run: function () {
            this.actor.kill("basic");
            this.actor.role.loved = true;
            this.actor.role.data.InfestHost = this.target;
          },
        },
        shouldMeet() {
          return !this.loved;
        },
      },
      "Control Host": {
        states: ["Night"],
        flags: ["voting"],
         targets: { include: ["alive"] },
        whileDead: true,
        whileAlive: false,
        action: {
          priority: PRIORITY_REDIRECT_ACTION,
          run: function () {
            let toControl = this.actor.role.data.InfestHost;
            if (!toControl) {
              return;
            }

            this.redirectAllActions(toControl, this.target);
          },
        },
        shouldMeet() {
          return this.loved;
        },
      },
    };

    speak(message) {
    if (message.abilityName != "Speak As Host") return;

    message.modified = true;

    let puppet = this.player.role.data.InfestHost;
    message.sender = puppet;

    message.recipients = [];
    for (let player of message.game.players)
      if (player != puppet) message.recipients.push(player);

    message.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;

    let puppet = this.player.role.data.InfestHost;
    message.prefix = `controlling ${puppet.name}`;

    return message;
  }

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player != this.player.role.data.InfestHost) return;
        if(this.player.alive) return;
        this.game.exorcisePlayer(this.player);
        
      },
    };
    
  }
};
