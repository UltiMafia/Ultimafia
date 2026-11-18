const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const AllRoles = require("../../../../../data/roles");
const Action = require("../../Action");
const { PRIORITY_BECOME_DEAD_ROLE } = require("../../const/Priority");
const { roleWith } = require("../../../../../lib/roleIdentity");

module.exports = class LoseModifiers extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Convert", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_BECOME_DEAD_ROLE,
        labels: ["convert", "absolute"],
        run: function () {
          if (this.game.getStateName() != "Night") return;

          this.actor.setRole(
            roleWith(this.actor.role, { modifiers: [] }),
            this.actor.role.data,
            false,
            false,
            false,
            "No Change",
            "NoStartingItems"
          );
        },
      },
    ];
  }
};
