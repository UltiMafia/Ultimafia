const Item = require("../Item");

module.exports = class PresidentialPower extends Item {
  constructor() {
    super("Presidential Power");

    this.meetings = {
        "Choose Power": {
          states: ["Executive Action"],
          flags: ["voting"],
          inputType: "custom",
          targets: ["Investigate Loyalty", "Call Special Election", "Policy Peek", "Execution"],
          action: {
            labels: ["hidden"],
            run: function () {
              this.actor.role.data.presidentalPower = this.target;
            },
          },
        },
        "Use Power": {
          states: ["Executive Action"],
          flags: ["voting"],
          targets: { include: ["alive"], exclude: ["self", isPrevInvest] },
          action: {
            labels: ["hidden"],
            run: function () {
              let presidentalPower = this.actor.role.data.presidentalPower;
              if (presidentalPower == "Investigate Loyalty") {
                var role = this.target.getAppearance("investigate", true);
                var loyalty = this.game.getRoleAlignment(role);
                this.actor.queueAlert(`You learn that ${this.target.name} is loyal towards ${loyalty}.`);
              } else if (presidentalPower == "Call Special Election") {
                this.game.queueAlert(`A Special Election has been called.`);
                this.game.queueAlert(`${this.target.name} has been selected as the presidential candidate.`);
                this.target.holdItem("Special Presidential Candidate");
                this.game.specialElection = true;
                this.game.normalElection = false;
              } else if (presidentalPower == "Policy Peek") {
                this.actor.queueAlert(`You see that ${this.game.policyList[0]}, ${this.game.policyList[1]} and ${this.game.policyList[0]} are the three next policies.`);
              } else if (presidentalPower == "Execution") {
                if (this.dominates()) {
                  this.target.kill("presidentialExecution", this.actor);
                  if (this.target.role == "Hitler") {
                    this.game.hitlerAssassinated = true;
                  }
                }
              }
              this.actor.role.data.prevTarget = this.target;
              this.item.drop();
              delete this.actor.role.data.presidentalPower;
            },
          },
        },
      };
  }
};

function isPrevInvest(player) {
  if (presidentalPower == "Investigate Loyalty") {
    return this.role && player == this.role.data.prevTarget;
  }
}