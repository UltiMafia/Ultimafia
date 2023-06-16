const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class PsychesSenses extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {  
          if (!this.actor.alive) return;
          if (this.game.getStateName() != "Night") return;

          let visits = this.getVisits(this.actor.data.psycheTarget);
          let visitors = this.getVisitors(this.actor.data.psycheTarget);
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
  
        this.data.psycheTarget = Random.randArrayVal(this.game.alivePlayers().filter((p) => p !== this.player));
    }
   }
  }
};
