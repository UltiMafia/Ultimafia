const Item = require("../Item");

module.exports = class PresidentialExecutivePower extends Item {
  constructor() {
    super("Presidential Executive Power");

    this.lifespan = 1;
    this.meetings = {
      "Use Power": {
        states: ["Executive Action"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevInvest] },
        action: {
          labels: ["hidden"],
          run: function () {
            if (this.game.presidentialPower == "Investigate Loyalty") {
              var role = this.target.getAppearance("investigate", true);
              var loyalty = this.game.getRoleAlignment(role);
              this.actor.queueAlert(
                `You learn that ${this.target.name} is loyal towards ${loyalty}.`
              );
            } else if (this.game.presidentialPower == "Call Special Election") {
              this.game.queueAlert(`A Special Election has been called.`);
              this.game.queueAlert(
                `${this.target.name} has been selected as the presidential candidate.`
              );
              this.target.holdItem("Special Presidential Candidate");
              this.game.specialElection = true;
            } else if (this.game.presidentialPower == "Policy Peek") {
              this.actor.queueAlert(
                `You see that ${this.game.policyList[0]}, ${this.game.policyList[1]} and ${this.game.policyList[0]} are the three next policies.`
              );
            } else if (this.game.presidentialPower == "Execution") {
              if (this.dominates()) {
                this.target.kill("presidentialExecution", this.actor);
                if (this.target.role == "Hitler") {
                  this.game.hitlerAssassinated = true;
                }
              }
            }
            this.actor.role.data.prevTarget = this.target;
          },
        },
      },
    };
  }
};

function isPrevInvest(player) {
  if (this.game.presidentialPower == "Investigate Loyalty") {
    return this.role && player == this.role.data.prevTarget;
  }
}
