const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class RevealRoleToTarget extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
        labels: ["investigate", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          var alert = `:mask: You learn that you were targeted by ${this.actor.getRoleAppearance()}.`;

          if (this.actor.hasEffect("FalseMode")) {
            let players = this.game
              .alivePlayers()
              .filter(
                (p) =>
                  p.getRoleAppearance("condemn").split(" (")[0] !=
                  this.actor.role.name
              );
            alert = `:mask: You learn that you were visited by ${Random.randArrayVal(
              players
            ).getRoleAppearance()}.`;
          }

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.queueAlert(alert));
        },
      },
    ];
  }
};
