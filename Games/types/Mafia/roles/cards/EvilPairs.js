const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class EvilPairs extends Card {
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

           var alive = this.game.players.filter(
            (p) => p.alive && p != this.actor
          );
          var evilPlayers = alive.filter(
              (p) =>
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Cult" ||
                this.game.getRoleAlignment(
                  p.getRoleAppearance().split(" (")[0]
                ) == "Mafia"
            );
          
          var neighbors;
          var evilPair = 0;
          for (let x = 0; x < evilPlayers.length; x++){

            neighbors = evilPlayers [x].getAliveNeighbors();
            if(neighbors [1].role.alignment == "Cult" || neighbors [1].role.alignment){
              evilPair = evilPair+1;
            }
          }

          this.actor.queueAlert(
            `After Evaluating the neighborhood you learn that there is ${evilCount} pairs of evil players!`
          );
          this.actor.role.hasInfo = true;
        },
      },
    ];
  }
};
