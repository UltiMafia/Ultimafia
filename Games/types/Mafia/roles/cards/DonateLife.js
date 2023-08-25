const Card = require("../../Card");
const {
  PRIORITY_NIGHT_SAVER,
  PRIORITY_EFFECT_GIVER_DEFAULT,
} = require("../../const/Priority");

module.exports = class DonateLife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Harvest Life": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_NIGHT_SAVER - 1,
          run: function () {
            this.heal();
            this.actor.role.savedTarget = this.target;
          },
        },
      },
      "Donate Life": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            const savedTarget = this.actor.role.savedTarget;
            if (!savedTarget) return;
            if (!this.hasVisitors(savedTarget, "kill")) return;

            this.target.giveEffect("ExtraLife");
            this.target.queueAlert(
              "You have received an organ donation, giving you an extra life!"
            );
          },
        },
      },
    };
  }
};
