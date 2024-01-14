const { addArticle } = require("../../../../core/Utils");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitorsRole extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate", "role", "hidden", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (!this.actor.alive) return;

          let visitors = this.getVisitors(this.actor);
          for (let visitor of visitors) {
            this.actor.queueAlert(`Last night, ${addArticle(visitor.getRoleAppearance())} visited you and confessed their sins.`);
          }
        },
      },
    ];
  }
};
