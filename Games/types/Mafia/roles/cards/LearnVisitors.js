const { addArticle } = require("../../../../core/Utils");
const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class LearnVisitors extends Card {
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
            this.actor.queueAlert(`:invest: You learn that ${visitor.name}'s role is ${addArticle(visitor.getRoleAppearance())}.`);
          }
        },
      },
    ];
  }
};
