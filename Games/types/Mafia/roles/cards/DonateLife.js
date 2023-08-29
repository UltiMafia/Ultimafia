const Card = require("../../Card");
const {
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
          run: function () {
            if (target.kill("*", this.actor) && this.dominates()) {
            this.actor.role.data.harvested++;
            }
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
            this.target.giveEffect("ExtraLife");
            this.target.queueAlert(
              "You have received an organ donation, giving you an extra life!"
            );
            this.actor.role.data.harvested--;
          },
        },
      },
    };
  }
};
