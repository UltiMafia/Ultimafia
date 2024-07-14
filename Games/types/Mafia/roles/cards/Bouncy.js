const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../../const/Priority");

module.exports = class Bouncy extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
          labels: ["redirect"],
          priority: PRIORITY_MODIFY_ACTION,
          run: function () {

          if (this.game.getStateName() != "Night") return;
          if (!this.actor.alive) return;
              var alive = this.game.players.filter(
                (p) =>
                  p.alive &&
                  p != this.actor &&
                  p.role.alignment == this.actor.role.alignment
              );
              if (alive.length > 0) {
                var randomTarget = Random.randArrayVal(alive);
                for (const action of this.game.actions[0]) {
                  if (action.target === this.actor && action.hasLabel("kill")) {
                    action.target = randomTarget;
                  }
                }
              }
            
          },
      },
    ];
  }
};
