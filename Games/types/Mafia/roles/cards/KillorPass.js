const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_KILL_SPECIAL } = require("../../const/Priority");

module.exports = class KillorPass extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Kill: {
        actionName: "Kill",
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive", "self"] },
        action: {
          labels: ["kill"],
          priority: PRIORITY_KILL_SPECIAL,
          run: function () {
            let savers = this.getVisitors(this.target, "save");
            if (savers.length == 0 && this.target === this.actor) {
              var aliveTargets = this.game.players.filter(
                (p) => p.alive && p != this.actor
              );
              var cultTargets = aliveTargets.filter(
                (p) => p.role.alignment == "Cult"
              );

              if (cultTargets.length > 0) {
                const randomTarget = Random.randArrayVal(cultTargets);
                randomTarget.setRole(
                  `${this.actor.role.name}:${this.actor.role.modifier}`,
                  this.actor.role.data
                );
                this.actor.kill("basic");
              }
            }

            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
