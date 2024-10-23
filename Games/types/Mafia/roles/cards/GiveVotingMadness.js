const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class GiveVotingMadness extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Victim: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"], exclude: ["dead"] },
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
        targets: { include: ["alive", "self"], exclude: ["dead"] },
        action: {
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            if (!this.actor.role.data.victim) {
              return;
            }
            let victim = this.actor.role.data.victim;

            victim.queueAlert(
              `A ${this.actor.role.name} has selected for you to be mad at ${this.target.name}. If ${this.target.name} does not receive votes from 1/3 or more of the living players, You, ${this.target.name}, or Both will Die!`
            );
            this.actor.role.data.victim.giveEffect(
              "VotingMadness",
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