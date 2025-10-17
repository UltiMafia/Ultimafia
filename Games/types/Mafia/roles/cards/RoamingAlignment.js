const Card = require("../../Card");
const {
  PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");

module.exports = class RoamingAlignment extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Align With": {
        states: ["Night"],
        flags: ["voting", "mustAct"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          priority: PRIORITY_MODIFY_INVESTIGATIVE_RESULT_DEFAULT,
          role: this.role,
          run: function () {
            this.actor.role.data.prevTarget = this.target;
            let alignment = this.target.faction;
            if (alignment == "Independent") {
              alignment = this.target.role.name;
              return;
            }

            this.actor.faction = alignment;
            this.actor.queueAlert(
              `You follow ${this.target.name} and will win if they win.`
            );
          },
        },
      },
    };
  /*
    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.player.alive || !this.data.alignment) {
          return;
        }

        if (
          confirmedFinished &&
          winners.groups[this.data.alignment] &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }

        if (
          aliveCount <= 2 &&
          this.data.alignment != "Village" &&
          !winners.groups[this.name]
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };
    */
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
