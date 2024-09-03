const Item = require("../Item");
const Action = require("../Action");
const Player = require("../../../core/Player");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheLunatic extends Item {
  constructor(lifespan) {
    super("IsTheLunatic");

    this.lifespan = lifespan || Infinity;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.roleAssignedCounter = 0;
    this.listeners = {
      state: function (stateInfo) {
        //if (this.game.getStateName() != "Night") return;
        if (!this.holder.alive) return;

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.alignment = "Village"
            this.target.role.name = "Lunatic";
            this.target.role.appearance.death = "Lunatic";
            this.target.role.appearance.reveal = "Lunatic";
            this.target.role.appearance.investigate = "Lunatic";
            this.target.role.appearance.condemn = "Lunatic";
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };

            this.target.role.data.banished = true;

            if (this.dominates(this.target)) {
              this.blockWithMindRot(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
      roleAssigned: function (player) {
        //if (this.game.getStateName() != "Night") return;
        if (!this.holder.alive) return;

        this.roleAssignedCounter =  this.roleAssignedCounter + 1;
        if(this.roleAssignedCounter > 1){
          this.drop();
          return;
        }
        
        if (this.holder.role.alignment == "Mafia") {
          this.drop();
          return;
        }

        this.action = new Action({
          actor: this.holder,
          target: this.holder,
          game: this.game,
          priority: PRIORITY_FULL_DISABLE + 1,
          labels: ["hidden", "block"],
          run: function () {
            this.target.role.alignment = "Village"
            this.target.role.appearance.death = "Lunatic";
            this.target.role.appearance.reveal = "Lunatic";
            this.target.role.appearance.investigate = "Lunatic";
            this.target.role.appearance.condemn = "Lunatic";
            this.target.role.hideModifier = {
              death: true,
              reveal: true,
              investigate: true,
              condemn: true,
            };

            this.target.role.data.banished = true;

            let cultPlayers = this.game.players.filter((p) => p.role.alignment == "Cult");

            for(let x = 0; x < cultPlayers.length; x++){
              cultPlayers [x].queueAlert(
            `You learn that ${this.target.name} is the ${this.target.role.name} !`
            );
            }

            if (this.dominates(this.target)) {
              this.blockWithMindRot(this.target);
            }
          },
        });

        this.game.queueAction(this.action);
      },
      vote: function (vote) {
              if (this.game.getStateName() != "Night") return;
        if (vote.voter == this.player) {
          

          let cultPlayers = this.game.players.filter((p) => p.role.alignment == "Cult");
          let toCheck = vote.target;
          if (!Array.isArray(vote.target)) {
          toCheck = [vote.target];
          }

          if (
        vote.target &&
        toCheck[0] instanceof Player
        ) {

           for(let x = 0; x < cultPlayers.length; x++){
             for(let y = 0; y < toCheck.length; y++){
              cultPlayers [x].queueAlert(
            `You learn that ${this.player.name} has selected ${toCheck[y].name} !`
            );
             }
            } 
        }
        }
      },
    };
  }
};
