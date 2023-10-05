const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");
const { maxWillLength } = require("../../../../../data/constants");

module.exports = class ForgeWill extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      [`Forge Last Will (max ${maxWillLength})`]: {
        states: ["Night"],
        flags: ["voting"],
        inputType: "text",
        textOptions: {
          maxLength: maxWillLength,
          alphaOnly: false,
          toLowerCase: false,
          submit: "Forge",
        },
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT - 1,
          run: function () {
            this.actor.role.data.forgedWill = this.target;
          },
        },
      },

      "Forge Target": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.queueAlert(
              `:will: You find ${this.target.name}'s real will: ${this.target.lastWill}`
            );
            this.target.lastWill = this.actor.role.data.forgedWill;
          },
        },
      },
    };
  }
};
