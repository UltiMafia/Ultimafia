const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class PlagueStarter extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Poison: {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self"] },
        action: {
          labels: ["effect"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.hasInfected = true;
            if (this.dominates()) {
              this.target.giveEffect("Virus");
            }
          },
        },
        shouldMeet: function () {
          return !this.hasInfected;
        },
      },
    };

     this.listeners = {
        state: function (stateInfo) {
          /*
        if (!this.player.hasAbility(["Kill", "Effect", ""])) {
          return;
        }
          */

        if (!stateInfo.name.match(/Night/)) {
          this.game.HasDonePlagueVirusAction = false;
          return;
        }
        if(this.game.HasDonePlagueVirusAction == true){
    return;
        }
        this.game.HasDonePlagueVirusAction = true;
        var action = new Action({
          actor: null,
          game: this.player.game,
          priority: PRIORITY_KILL_DEFAULT,
          labels: ["kill", "hidden", "absolute"],
          run: function () {
          for(let player of this.game.players){
           if(player.hasEffect("Virus")){
             for(let effect of player.effects){
               if(effect.name == "Virus"){
                 effect.InfectionTime++
                 if(effect.InfectionTime >= 2){
                   if (this.dominates()) {
                   player.kill("basic", null);
                   }
                 }
               }
             }
            for (let neighbor of player.getNeighbors()) {
              if (neighbor.hasEffect("Virus")) {
                continue;
              }

            neighbor.giveEffect("Virus");
            }
          }
          }
          },
        });

        this.game.queueAction(action);
      },
    };


    
  }
};
