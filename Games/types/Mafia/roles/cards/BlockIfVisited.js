const Card = require("../../Card");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class BlockIfVisited extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        priority: PRIORITY_NIGHT_ROLE_BLOCKER,
        labels: ["block", "hidden"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          if (this.hasVisitors() === true) {
            this.blockActions(this.actor);
          }
        },
      },
    ];
*/
    this.listeners = {
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER,
          labels: ["block", "hidden"],
          run: function () {
            if (this.hasVisitors() === true) {
              this.blockActions(this.actor);
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
