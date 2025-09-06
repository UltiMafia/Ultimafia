const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class StyleContest extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function () {
         if (this.game.getStateName() == "Night"){
           var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          labels: ["role", "hidden"],
          role: this,
          run: function () {

          let subaction = new Action({
          actor: this.actor,
          game: this.actor.game,
          labels: ["role", "hidden"],
          role: this.role,
          run: function () {
            if(!this.role.TaskComp){
              this.role.TaskComp = [];
            }
            if(this.target){
              this.role.TaskComp.push(this.target);
            }
          },
        });
          let teammates = this.game.players.filter((p) => p.faction == this.actor.faction);
          for(let player of teammates){
            if(player.alive){
              player.giveEffect("DayTask", this.role, player, subaction, null, teammates.length-teammates.filter((p)=> p.alive));
            }
          }
          },
        });

        this.game.queueAction(action);
         }
        if (this.game.getStateName() == "Day") {
          let contest = [];
          for (let player of this.game.players) {
            if (player.data.StylePoints > 0) {
              contest.push(player);
            }
          }
          for (let member of contest) {
            this.game.queueAlert(
              `${member.name} has ${member.data.StylePoints} Style Points!`,
              0,
              this.game.players.filter(
                (p) => p.role.alignment === this.player.role.alignment
              )
            );
          }
        }
      },
    };
  }
};
