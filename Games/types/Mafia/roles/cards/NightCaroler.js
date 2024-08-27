const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const {
  PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
} = require("../../const/Priority");

module.exports = class NightCaroler extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sing Carol": {
        states: ["Night"],
        flags: ["voting"],
        targets: { include: ["alive"], exclude: ["self", isPrevTarget] },
        action: {
          labels: ["carol"],
          priority: PRIORITY_INVESTIGATIVE_AFTER_RESOLVE_DEFAULT,
          run: function () {
            this.actor.role.data.prevTarget = this.target;

            var alive = this.game.players.filter((p) => p.alive);
            if (alive.length < 3) return;

            var carol;
            var evilPlayers = alive.filter(
              (p) => p.role.alignment == "Mafia" || p.role.alignment == "Cult"
            );

            if (this.actor.hasEffect("FalseMode")) {
              evilPlayers = alive.filter(
                (p) => p.role.alignment != "Mafia" && p.role.alignment != "Cult"
              );
            }

            if(evilPlayers.length <= 0){
              return;
            }

            /* We need to handle a list of visits in order to know if the target should receieve a carol
               if the list is empty, that means the target doesn't visit and should get the carol. */
            let visits = this.getVisits(this.target);
            //If the target viaits they should not receive a carol
            if (visits.length > 0) {
              return;
            } else {
              // guarantee no repeats in carol
              var chosenThree = [Random.randArrayVal(evilPlayers)];
              alive = alive.filter((p) => p !== chosenThree[0]);
              alive = Random.randomizeArray(alive);
              chosenThree.push(alive[0]);
              chosenThree.push(alive[1]);
              chosenThree = Random.randomizeArray(chosenThree);

              if (this.actor.hasEffect("FalseMode")) {
                if(evilPlayers.length <= 2){
                return;
                }
                evilPlayers = Random.randomizeArray(evilPlayers);
                chosenThree = [];
                chosenThree.push(evilPlayers[0]);
                chosenThree.push(evilPlayers[1]);
                chosenThree.push(evilPlayers[2]);
              }

              carol = `:carol: You see a merry Caroler outside your house! They sing you a Carol about ${chosenThree[0].name}, ${chosenThree[1].name}, ${chosenThree[2].name}, at least one of whom is evil!`;
            }

            this.target.queueAlert(carol);
          },
        },
      },
    };
  }
};

function isPrevTarget(player) {
  return this.role && player == this.role.data.prevTarget;
}
