const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_BLOCK_SELF_IF_KILLED, PRIORITY_FATAL_KILLS, PRIORITY_BLOCK_SELF_IF_KILLED_POST_FATAL } = require("../../const/Priority");

module.exports = class BlockedIfKilled extends Card {
  constructor(role) {
    super(role);

    this.passiveActions = [
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_SELF_IF_KILLED,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          if (!this.actor.alive) {
            this.blockActions(this.actor);
          }
        },
      },
      {
        ability: ["Modifier", "WhenDead"],
        state: "Night",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_BLOCK_SELF_IF_KILLED_POST_FATAL,
        labels: ["block", "hidden"],
        role: role,
        run: function () {
          if (!this.actor.alive) {
            this.blockActions(this.actor);
          }
        },
      },
    ];

    this.listeners = {
      actionsNext: function (actions) {
        if (!this.hasAbility(["Modifier", "WhenDead"])) {
          return;
        }
        for(let action of actions){
          if(action.actors && action.actors.indexOf(this.player) != -1){
            if(!action.hasLabels(["kill"])){
            continue;
            }
            else if(action.hasLabels(["kill", "mafia"])){
            continue;
            }
            else{
              action.priority = PRIORITY_FATAL_KILLS;
            }
          }
        }
      },
    };

    
  }
};
