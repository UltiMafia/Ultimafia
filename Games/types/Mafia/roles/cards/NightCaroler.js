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
            
            

            /* We need to handle a list of visits in order to know if the target should receieve a carol
               if the list is empty, that means the target doesn't visit and should get the carol. */
            let visits = this.getVisits(this.target);
            //If the target viaits they should not receive a carol
            if (visits.length > 0) {
              return;
            } else {
              let info = this.game.createInformation(
              "ThreePlayersOneEvilInfo",
              this.actor,
              this.game
            );
            info.processInfo();
            var carol = info.getInfoRaw();
            if(carol == "No Evil Players Exist"){
              return;
            }

              carol = `:carol: You see a merry Caroler outside your house! They sing you a Carol about ${carol[0].name}, ${carol[1].name}, ${carol[2].name}, at least one of whom is evil!`;
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
