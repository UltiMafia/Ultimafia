const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class AvoidGroupActions extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_NIGHT_ROLE_BLOCKER + 4,
        run: function () {
          if (!this.actor.alive) return;
          for (let action of this.game.actions[0]) {
            if (
              action.actors.includes(this.actor) &&
              action.actors.length > 1
            ) {
              action.actors.splice(action.actors.indexOf(this.actor), 1);
            }
          }
        },
      },
    ];
  }
};
