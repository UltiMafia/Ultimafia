const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_EFFECT_REMOVER_DEFAULT,
  PRIORITY_CLEANSE_LYCAN_VISITORS,
  PRIORITY_CANCEL_ROLEBLOCK_ACTIONS,
  PRIORITY_KILL_WEREWOLF_VISITORS_ENQUEUE,
  PRIORITY_KILL_DEFAULT,
  PRIORITY_EFFECT_REMOVER_EARLY,
} = require("../../const/Priority");
module.exports = class CleanseVisitors extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Effect"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_EFFECT_REMOVER_DEFAULT,
        labels: ["cleanse", "hidden"],
        role: role,
        run: function () {
          let visitors = this.getVisitors();

          for (let visitor of visitors) {
            this.heal(1, visitor);
          }

          for (let action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {
              this.cleanse(1, action.actor);
            }
          }
        },
      },
      {
        ability: ["Effect"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_EFFECT_REMOVER_EARLY,
        labels: ["cleanse", "hidden"],
        role: role,
        run: function () {
          let visitors = this.getVisitors();

          for (let visitor of visitors) {
            this.heal(1, visitor);
          }

          for (let action of this.game.actions[0]) {
            if (action.target == this.actor && !action.hasLabel("hidden")) {
              this.cleanse(1, action.actor);
            }
          }
        },
      },
    ];
  }
};
