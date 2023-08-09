const { addArticle } = require("../../../../core/Utils");
const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Watch (no visit)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run: function () {
            let visitors = this.getVisitors(this.target);
            let visitorRoles = visitors.map((p) =>
              addArticle(p.getRoleAppearance())
            );
            if (visitorRoles.length === 0) {
              visitorRoles.push("no roles");
            }

            this.actor.queueAlert(
              `:look: ${this.target.name} was visited by ${visitorRoles.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};
