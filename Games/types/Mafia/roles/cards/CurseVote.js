const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class CurseVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Victim: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: this.role,
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            this.role.data.victim = this.target;
          },
        },
      },
      Target: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          role: this.role,
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (!this.role.data.victim) {
              return;
            }

            this.role.data.victim.giveEffect(
              "CursedVote",
              this.actor,
              this.target,
              1
            );
            delete this.role.data.victim;
          },
        },
      },
    };
  }
};
