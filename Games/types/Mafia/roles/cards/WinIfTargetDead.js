const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfTargetDead extends Card {
  constructor(role) {
    super(role);

    this.killer = null;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if(this.canDoSpecialInteractions() && this.game.players.filter((p) => p.hasEffect("AssassinEffect")).length > 0){
        if(confirmedFinished &&
           !this.player.alive &&
           this.game.players.filter((p) => !p.alive && (p.hasEffect("PresidentEffect") || p.hasEffect("SenatorEffect") || (p.role.modifier.split("/").includes("Vital") && p.role.alignment == "Village"))).length <= 0
          ){
          winners.addPlayer(this.player, this.name);
        }
        else{
        return;
        }
        }
        if (this.player.alive && aliveCount == 1) {
          winners.addGroup("No one");
          return;
        }
        
        if (!confirmedFinished && counts["Village"] != aliveCount) {
          // game not ended
          return;
        }

        if (this.killer && !this.killer.alive && this.killer !== this.player) {
          winners.addPlayer(this.player, this.name);
          return;
        }
      },
    };
    this.listeners = {
      death: function (player, killer, deathType) {
        if (player == this.player && deathType != "condemn") {
          this.killer = killer;
        }
      },
    };
  }
};
