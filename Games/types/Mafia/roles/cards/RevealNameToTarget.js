const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class RevealNameToTarget extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        labels: ["investigate", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var alert = `:mask: You learn that you were visited by ${this.actor.name}.`;

          if(this.actor.hasEffect("FalseMode")){
            let players = this.game.alivePlayers().filter((p) => p != this.actor);
            alert = `:mask: You learn that you were visited by ${Random.randArrayVal(players).name}.`;
          }

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.queueAlert(alert));
        },
      },
    ];
  }
};
