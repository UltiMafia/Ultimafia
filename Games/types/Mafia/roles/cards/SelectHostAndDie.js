const Card = require("../../Card");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");
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
          priority: PRIORITY_BLOCK_EARLY - 1,
          labels: ["absolute"],
          run: function () {
            this.actor.role.loved = true;
            this.actor.role.data.InfestHost = this.target;
            this.actor.kill("basic");
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
          labels: ["hidden"],
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

    this.listeners = {
      death: function (player, killer, deathType) {
        if (!this.player.alive && !this.player.role.data.InfestHost) {
          this.game.exorcisePlayer(this.player);
        }
        if (player != this.player.role.data.InfestHost) return;
        if (this.player.alive) return;
        this.game.exorcisePlayer(this.player);
      },
    };
  }

  speak(message) {
    if (message.abilityName != "Speak As Host") return;

    message.modified = true;

    let puppet = message.sender.role.data.InfestHost;
    message.sender = puppet;

    message.recipients = [];
    for (let player of message.game.players) {
      if (player != puppet) message.recipients.push(player);
    }
    message.alive = true;
    message.aliveOverride = true;
    message.parseForReview = this.parseForReview;
  }

  parseForReview(message) {
    message.recipients = message.versions["*"].recipients;

    let puppet = message.sender;
    message.prefix = `controlling ${puppet.name}`;

    return message;
  }
};
