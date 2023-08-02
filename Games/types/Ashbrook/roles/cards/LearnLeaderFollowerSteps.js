const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");


module.exports = class LearnLeaderFollowerSteps extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player.role.alignment !== "Leader") return;

        let counter = 1;

        let alive = this.game.alivePlayers();
        let leader = this.game.players.filter((p) => p.role.alignment == "Leader");
        let followers = this.game.players.filter((p) => p.role.alignment == "Follower");
        let index = alive.indexOf(leader[0]);

        let leftIn = (index - 1 + alive.length) % alive.length;
        let rightIn = (index + 1) % alive.length;

        let leftNeighbor = alive[leftIn];
        let rightNeighbor = alive[rightIn];
        while (!(followers.indexOf(leftNeighbor) > -1 || followers.indexOf(rightNeighbor) > -1)){
          counter++;
          // left neighbor
          leftIn = alive.indexOf(leftNeighbor);
          leftIn = (leftIn - 1 + alive.length) % alive.length;

          leftNeighbor = alive[leftIn];
          // right neighbor
          rightIn = alive.indexOf(rightNeighbor);
          rightIn = (rightIn + 1) % alive.length;

          rightNeighbor = alive[rightIn];
        }
        if (player.hasEffect("Insanity")) counter = Random.randInt(0, Math.floor(aliveCount / 2));
        this.player.queueAlert(`You learn that the Leader is ${counter} ${counter == 1 ? "person" : "people"} away from its closest Follower!`);
      }
    };
  }
}
