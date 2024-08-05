const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class TrackAndWatchPlayer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Shadow: {
        actionName: "Track and Watch",
        states: ["Night"],
        flags: ["voting"],
        action: {
          priority: PRIORITY_INVESTIGATIVE_DEFAULT,
          run: function () {
            let visits = this.getVisits(this.target);
            let visitNames = visits.map((p) => p.name);
            let visitors = this.getVisitors(this.target);
            let visitorNames = visitors.map((p) => p.name);

            if(this.actor.hasEffect("FalseMode")){
              let players = this.game.alivePlayers().filter((p) => p != this.actor);
              players = players.filter((p) => p != this.target);
              let playerNames = players.map((p) => p.name);
              if (visitNames.length == 0){
                visitNames.push(Random.randArrayVal(playerNames));
              }
              else{
                visitNames = [];
              }
              if (visitorNames.length == 0){
                visitorNames.push(Random.randArrayVal(playerNames));
              }
              else{
                visitorNames = [];
              }
            }

            if (visitNames.length == 0) visitNames.push("no one");
            if (visitorNames.length === 0) visitorNames.push("no one");

            this.actor.queueAlert(
              `:watch: ${this.target.name} was visited by ${visitorNames.join(
                ", "
              )} during the night.`
            );

            this.actor.queueAlert(
              `:watch: ${this.target.name} visited ${visitNames.join(
                ", "
              )} during the night.`
            );
          },
        },
      },
    };
  }
};
