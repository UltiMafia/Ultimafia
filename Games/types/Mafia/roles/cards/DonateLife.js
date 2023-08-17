const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

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
            if (!this.player.alive) {
              this.actor.role.data.harvestedLife++;
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
            if (this.actor.role.data.harvestedLife >= 1) {
              this.target.giveEffect("ExtraLife");
              this.target.queueAlert("You gain an extra life!");
              this.actor.role.data.harvestedLife--;
            }
          },
        },
      },
    };
  }
};
