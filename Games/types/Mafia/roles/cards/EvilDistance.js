const Card = require("../../Card");
const Random = require("../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class EvilDistance extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        labels: ["investigate"],
        run: function () {
          if (this.game.getStateName() != "Night") return;
          if (this.actor.role.hasInfo) return;
          if (!this.actor.alive) return;

          let alive = this.game.alivePlayers();
          var evilPlayers = alive.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Cult" ||
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Mafia"
          );

          if(evilPlayers.length <= 1){
          this.actor.queueAlert(
            `There wasn't enough evil players for your abilty to work!`
          );
            return.
          }

          var evilTarget = Random.randArrayVal(evilPlayers);
          var indexOfTarget = alive.indexOf(evilTarget);;
          var rightIdx;
          var leftIdx;
          var leftAlign;
          var rightAlign
          var distance = 0;
          var found = false;

          while(!found){
            
          leftIdx = (indexOfTarget - distance-1 + alive.length) % alive.length;
          rightIdx = (indexOfTarget + distance+1) % alive.length;
          leftAlign = this.game.getRoleAlignment(
              alive[leftIdx].getRoleAppearance().split(" (")[0]
            );
          rightAlign = this.game.getRoleAlignment(
              alive[rightIdx].getRoleAppearance().split(" (")[0]
            );

        if(rightAlign == "Cult" || rightAlign == "Mafia"){
            found = true;
        }
        else if(leftAlign == "Cult" || leftAlign == "Mafia"){
            found = true;
        }
        else{
          distance = distance+1;
        }
          }

          this.actor.queueAlert(
            `You learn that there is ${distance} players between 2 of the evil players in the game!`
          );
          this.actor.role.hasInfo = true;
        },
      },
    ];
  }
};
