const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class DonateLife extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Harvest Organs": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_NIGHT_SAVER - 1,
          run: function () {
            let killers = this.getVisitors(this.target, "kill");
            if (killers.length == 0) {
              return;
            }
            this.actor.role.data.harvestedOrgans = this.target;
          },
        },
      },
      "Give Life": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            if (this.actor.role.data.harvestedOrgans) {
              var harvestedOrgans = this.actor.role.data.harvestedOrgans;
              if (harvestedOrgans.length == 0) {
                return;
              }
              this.target.giveEffect("ExtraLife", this.actor);
              this.target.queueAlert("You gain an extra life!");

              delete this.actor.role.data.harvestedOrgans;
            }
          },
        },
      },
    };
  }
};
