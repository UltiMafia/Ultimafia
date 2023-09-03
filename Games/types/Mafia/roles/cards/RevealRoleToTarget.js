const Card = require("../../Card");
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

          var alert = `:learnrole: You learn that you were targeted by ${this.actor.getRoleAppearance()}.`;

          let visits = this.getVisits(this.actor);
          visits.map((v) => v.queueAlert(alert));
        },
      },
    ];
  }
};
