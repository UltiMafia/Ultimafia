const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class LeadGroupActions extends Card {
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
          //this.actor.giveEffect("Astral", )
          for (let action of this.game.actions[0]) {
            if (
              action.actors.includes(this.actor) &&
              action.actors.length > 1
            ) {
              for (let player of action.actors) {
                if (player != this.actor) {
                  action.actors.splice(action.actors.indexOf(player), 1);
                }
              }
              //action.labels = [...action.labels, "hidden"];
            }
          }
        },
      },
    ];
  }
};
