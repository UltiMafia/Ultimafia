const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const AllRoles = require("../../../../../data/roles");
const Action = require("../../Action");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");

module.exports = class LoseModifiers extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.hasAbility(["Convert", "Modifier"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_BECOME_DEAD_ROLE,
          labels: ["convert", "absolute"],
          run: function () {
            if (this.game.getStateName() != "Night") return;

            this.actor.setRole(
              this.actor.role.name,
              this.actor.role.data,
              false,
              false,
              false,
              "No Change",
              "NoStartingItems"
            );
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
