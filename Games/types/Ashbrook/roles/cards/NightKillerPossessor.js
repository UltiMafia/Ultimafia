const Card = require("../../Card");
const { PRIORITY_LEADER } = require("../../const/Priority");

module.exports = class NightKillerPossessor extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Leader Kill": {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: {include: ["alive"], exclude: ["self"]},
        shouldMeet: function () {
          return this.game.getStateInfo().id > 1;
        },
        action: {
          labels: ["kill", "leader"],
          priority: PRIORITY_LEADER,
          run: function () {
            if (this.isInsane()) return;

            if (this.dominates()){
              if (this.target.role.alignment == "Outcast" && this.actor.role.data.possessable){  
                this.actor.kill("basic", this.actor);
                this.target.setRole("Possessor");
              } else {
                this.target.kill("basic", this.actor);
              }
            }
          }
        },
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.data.possessable = false;
        },
      start: function() {
        this.data.possessable = true;
      }
    }
  };
}
