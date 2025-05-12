const Item = require("../Item");
const Action = require("../Action");
const Player = require("../../../core/Player");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheMole extends Item {
  constructor(originalFaction) {
    super("IsTheMole");

    this.lifespan = Infinity;
    this.originalFaction = originalFaction;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.listeners = {
      roleAssigned: function (player) {
        //if (this.game.getStateName() != "Night") return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.data.banished = true;

            let evilPlayers = this.game.players.filter(
              (p) => p.role.alignment == this.holder.role.alignment
            );

            for (let x = 0; x < evilPlayers.length; x++) {
              evilPlayers[x].queueAlert(
                `There is a Mole Amoungst your ranks! You may attempt to guess the mole once.`
              );
                evilPlayers[x].holdItem("MoleVoting");
              
            }
              this.actor.queueAlert(`You are the Mole, You have the abilites of a ${this.actor.role.name}`);
            
          },
        });

        this.game.queueAction(this.action);
      },
      handleWinWith: function (winners) {
        this.holder.role.name = "Mole";
        winners.removePlayer(this.holder, this.holder.faction);
        this.holder.faction = originalFaction;
        if(this.holder.faction == "Independent"){
          this.holder.faction = "Village";
        }
        if(winners[this.holder.faction]){
          winners.addPlayer(this.holder, this.holder.faction);
        }
      },
    };
  }
};
