const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class MakeKillHidden extends Card {
  constructor(role) {
    super(role);

    
    this.passiveActions = [
      {
        ability: ["Astral"],
        actor: role.player,
        state: "Night",
        game: role.game,
        role: role,
        priority: PRIORITY_NIGHT_ROLE_BLOCKER + 5,
        run: function () {
            if (!this.actor.alive) return;
            //this.actor.giveEffect("Astral", )
            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.actor) &&
                action.hasLabel("kill")
              ) {
                action.actors.splice(action.actors.indexOf(this.actor), 1);
                if (action.actors.length < 0) {
                  action.actors = [];
                  action.actor = null;
                }

                //action.labels = [...action.labels, "hidden"];
              }
            }
          },
      },
    ];

  }
};
