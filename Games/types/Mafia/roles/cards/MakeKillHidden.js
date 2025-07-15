const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_ROLE_BLOCKER } = require("../../const/Priority");

module.exports = class MakeKillHidden extends Card {
  constructor(role) {
    super(role);
    /*
    this.actions = [
      {
        labels: ["hidden"],
        // roleblockable
        priority: PRIORITY_NIGHT_ROLE_BLOCKER + 5,
        run: function () {
          if (!this.actor.alive) return;

          if (this.game.getStateName() != "Night") return;

          for (let action of this.game.actions[0]) {
            if (action.actors.includes(this.actor) && action.hasLabel("kill")) {
              action.labels = [...action.labels, "hidden"];
            }
          }
        },
      },
    ];
*/

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.hasAbility(["Astral"])) {
          return;
        }

        if (!stateInfo.name.match(/Night/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_NIGHT_ROLE_BLOCKER + 5,
          run: function () {
            if (!this.actor.alive) return;
            //this.actor.giveEffect("Astral", )
            for (let action of this.game.actions[0]) {
              if (
                action.actors.includes(this.actor) &&
                action.hasLabel("kill")
              ) {
          
                
               action.actors.splice(action.actors.indexOf(this.actor),1);
               if(action.actors.length < 0){
                action.actors = [];
                action.actor = null;
               }
              
                
                //action.labels = [...action.labels, "hidden"];
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
