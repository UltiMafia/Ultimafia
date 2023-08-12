const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class TrapLeader extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Trap: {
        states: ["Night"],
        targets: { include: ["alive"], exclude: [isPrevTarget] },
        action: {
          labels: ["block"],
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          run: function () {
            if (this.isInsane()) return;

            if (this.target.role.alignment == "Leader"){
              this.blockActions();
              this.target.queueAlert(`You learn that ${this.actor.name} is the Trapper and roleblocked you last night!`);
            }
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.prevTarget;
}