const Card = require("../../Card");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class WatchPlayerRole extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Watch (Role)": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: [] },
        action: {
          labels: ["investigate", "hidden"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run: function () {
            let visitors = this.getVisitors(this.target);
            let vowels = ("aeiouAEIOU");
            let visitorRoles = visitors.map((p) => ((vowels.indexOf(p[0]) !== -1) ? `an ${p.getRoleAppearance()}`:`a ${p.getRoleAppearance()}`));
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
