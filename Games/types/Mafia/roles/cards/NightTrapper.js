const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightTrapper extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Trap: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["trap"],
          item: role,
          priority: PRIORITY_KILL_DEFAULT,
          run: function () {
            let actorRole = this.item;

            // remove this actor
            let visitors = this.getVisitors(this.target)
              .sort(
                (x, y) =>
                  actorRole.data.mapAlignment(x.role.alignment) -
                  actorRole.data.mapAlignment(y.role.alignment)
              )
              .filter((p) => p != this.actor);

            if (visitors.length <= 0) {
              return;
            }

            let toKill = visitors[0];
            if (this.dominates(toKill)) {
              toKill.kill("trap", this.actor);
            }

            let toLearnRole = visitors.slice(1);
            this.game.queueAlert(
              `You learn that ${this.actor.name} is the ${actorRole.name}.`,
              0,
              toLearnRole
            );
          },
        },
      },
    };

    // map all to same
    role.data.mapAlignment = (x) => 0;
  }
};
