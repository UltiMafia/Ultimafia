const Card = require("../../Card");
const Action = require("../../Action");
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
          role: this.role,
          run: function () {
            let savers = this.getVisitors(this.target, "save");
            if (this.target === this.actor) {
              if (savers.length == 0 && this.dominates(this.actor)) {
                var aliveTargets = this.game.players.filter(
                  (p) => p.alive && p != this.actor
                );
                var cultTargets = aliveTargets.filter(
                  (p) => p.getRoleAlignment(true) == "Cult"
                );
                if (cultTargets.length <= 0) {
                  var cultTargets = aliveTargets.filter(
                    (p) => p.getRoleAlignment() == "Cult"
                  );
                }

                if (cultTargets.length > 0) {
                  const randomTarget = Random.randArrayVal(cultTargets);
                  let action = new Action({
                    actor: this.actor,
                    target: this.target,
                    role: this.role,
                    game: this.game,
                    labels: ["convert"],
                    run: function () {},
                  });
                  if (action.dominates(randomTarget)) {
                    randomTarget.setRole(
                      `${this.role.name}:${this.role.modifier}`,
                      this.role.data,
                      null,
                      null,
                      null,
                      "No Change"
                    );
                  }
                }
                this.actor.kill("basic");
              }
              return;
            }

            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
