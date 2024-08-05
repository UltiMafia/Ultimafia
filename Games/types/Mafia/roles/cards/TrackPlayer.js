const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Track: {
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let visits = this.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);


            if(this.actor.hasEffect("FalseMode")){
              let players = this.game.alivePlayers().filter((p) => p != this.target);
              let playerNames = players.map((p) => p.name);
              if (visitNames.length == 0){
                visitNames.push(Random.randArrayVal(playerNames));
              }
              else{
                visitNames = [];
              }
            }

            if (visitNames.length == 0) visitNames.push("no one");

            this.actor.queueAlert(
              `:track: ${this.target.name} visited ${visitNames.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};
