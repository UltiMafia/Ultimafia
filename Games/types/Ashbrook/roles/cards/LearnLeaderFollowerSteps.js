const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnLeaderFollowerSteps extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let counter = 1;

        let players = this.game.players;
        let leader = players.filter((p) => p.role.alignment == "Leader");
        let followers = players.filter((p) => p.role.alignment == "Follower");
        let index = players.indexOf(leader[0]);

        if (followers.length == 0){
          this.player.queueAlert("You learn that there are no Followers in play!");
          return;
        }

        let leftIn = (index - 1 + players.length) % players.length;
        let rightIn = (index + 1) % players.length;

        let leftNeighbor = players[leftIn];
        let rightNeighbor = players[rightIn];
        
        while (!(followers.indexOf(leftNeighbor) > -1 || followers.indexOf(rightNeighbor) > -1)){
          counter++;
          // left neighbor
          leftIn = players.indexOf(leftNeighbor);
          leftIn = (leftIn - 1 + players.length) % players.length;

          leftNeighbor = players[leftIn];

          // right neighbor
          rightIn = players.indexOf(rightNeighbor);
          rightIn = (rightIn + 1) % players.length;

          rightNeighbor = players[rightIn];
        }
        if (player.hasEffect("Insanity")) counter = Random.randInt(0, Math.floor(aliveCount / 2));
        this.player.queueAlert(`You learn that the Leader is ${counter} ${counter == 1 ? "person" : "people"} away from its closest Follower!`);
      }
    };
  }
}
