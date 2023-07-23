const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class CurseVote extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Victim: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["Mafia"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT - 1,
          run: function () {
            this.actor.role.data.victim = this.target;
          },
        },
      },
      Target: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (!this.actor.role.data.victim) {
              return;
            }
            
            this.actor.role.data.victim.giveEffect(
              "CursedVote",
              this.actor,
              this.target,
              1
            );
            delete this.actor.role.data.victim;
          },
        },
      },
    };
  }
};
