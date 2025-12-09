const Card = require("../../Card");
const Action = require("../../Action");
const Player = require("../../Player");
const { PRIORITY_MODIFY_ACTION_LABELS } = require("../../const/Priority");

module.exports = class StrongModifier extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Strong", "Modifier"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_MODIFY_ACTION_LABELS,
        run: function () {
          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor) && action.hasLabel("kill")) {
              action.power = Infinity;
              action.labels = [...action.labels, "absolute", "strong"];
              if (action.target && action.target instanceof Player) {
                action.target.removeEffect("Extra Life", true);
              }
            }
          }
        },
      },
    ];
  }
};
