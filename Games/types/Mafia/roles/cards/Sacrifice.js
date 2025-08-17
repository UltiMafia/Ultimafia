const Card = require("../../Card");
const { PRIORITY_KILL_SPECIAL } = require("../../const/Priority");

module.exports = class Sacrifice extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Sacrifice: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_SPECIAL - 4,
          role: this.role,
          run: function () {
            if (this.dominates()) {
              this.target.kill("basic", this.actor);
              if (this.role.data.PlayerToGiveExtraLifeTo) {
                this.role.data.PlayerToGiveExtraLifeTo.giveEffect(
                  "ExtraLife",
                  this.actor
                );
                this.role.data.PlayerToGiveExtraLifeTo.queueAlert(
                  "You gain an extra life!"
                );
              }
            }
            delete this.role.data.PlayerToGiveExtraLifeTo;
          },
        },
      },
      Anoint: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["Cult"], exclude: ["dead", "self"] },
        action: {
          priority: PRIORITY_KILL_SPECIAL - 5,
          role: this.role,
          run: function () {
            this.role.data.PlayerToGiveExtraLifeTo = this.target;
          },
        },
      },
    };
  }
};
