const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class Sacrifice extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Sacrifice: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);

            this.actor.role.data.harvestedOrgans = this.target;
          },
        },
      },
      Anoint: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
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
