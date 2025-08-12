const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class DieIfVisited extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Modifier", "Kill"])) {
          return;
        }
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden"],
          run: function () {
            if (this.hasVisitors() === true) {
              this.actor.kill("basic", this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
