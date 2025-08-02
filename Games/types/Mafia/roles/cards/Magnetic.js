const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");
const { PRIORITY_MODIFY_ACTION } = require("../../const/Priority");

module.exports = class Magnetic extends Card {
  constructor(role) {
    super(role);
 
    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["OnlyWhenAlive"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          labels: ["redirect"],
          priority: PRIORITY_MODIFY_ACTION-1,
          run: function () {
            
            var alive = this.game.players.filter(
              (p) =>
                p.alive &&
                p != this.actor &&
                p.role.alignment == this.actor.role.alignment
            );
            if (alive.length > 0) {
              for (const action of this.game.actions[0]) {
                if (action.target != this.actor &&  alive.includes(action.target) && action.hasLabel("kill")) {
                  action.target = this.actor;
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
