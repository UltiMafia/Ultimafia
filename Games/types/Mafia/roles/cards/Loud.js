const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class Loud extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT + 2,
        labels: [
          "investigate",
          "alerts",
          "hidden",
          "absolute",
          "uncontrollable",
        ],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          let reports = this.getReports(this.actor);
          for (let report of reports) {
            this.game.queueAlert(
              `:loud: A Loud ${this.actor.role.name} is overheard reading: ${report}`
            );
          }
        },
      },
    ];
  }
};
