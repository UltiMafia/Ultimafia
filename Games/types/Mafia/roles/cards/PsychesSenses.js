const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");
const { PRIORITY_DAY_DEFAULT } = require("../../const/Priority");

module.exports = class PsychesSenses extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Discover Target's Identity": {
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_DAY_DEFAULT,
          run: function () {
            if (this.dominates()) {
              if (this.target == "No") return;
              this.actor.queueAlert(`You learn that your target was ${this.actor.role.data.psycheTarget.name}!`)
              delete this.actor.role.data.psycheTarget;
            }
          },
        },
        shouldMeet() {
          return this.data.psycheTarget;
        },
      },
    },

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {  
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;
          if (!this.actor.role.data.psycheTarget) return;

          let visits = this.getVisits(this.actor.role.data.psycheTarget);
          let visitors = this.getVisitors(this.actor.role.data.psycheTarget);
          let visitorNames = visitors.map((player) => player.name);

          if (visits.length == 0) visits.push("no one");
          if (visitorNames.length === 0) visitorNames.push("no one");
          
          this.actor.queueAlert(
            `:sy0f: Your target was visited by ${visitorNames.join(
              ", "
            )} during the night.`
          );

          this.actor.queueAlert(
            `:sy0g: Your target visited ${visits.join(
              ", "
            )} during the night.`
          );
        },
      },
    ];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
  
        let possibleTargets = this.game.alivePlayers().filter((p) => p !== this.player && p.alive);
        this.data.psycheTarget = Random.randArrayVal(possibleTargets);
    }
   }
  }
};
