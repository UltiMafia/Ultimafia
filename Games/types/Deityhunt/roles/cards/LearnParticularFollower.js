const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularFollower extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let follower = this.game.players.filter((p) => p.role.alignment == "Follower");
        if (follower.length == 0){
          this.actor.queueAlert(`You learn that there are no followers in play!`);
        } else {
          let followerRole = follower.role.name;
          let otherPlayer = this.game.players.filter((p) => p != follower);
          var chosenTwo = [
            Random.randArrayVal(follower),
            Random.randArrayVal(otherPlayer),
          ];

          chosenTwo = Random.randomizeArray(chosenTwo);

          this.actor.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${followerRole}!`);
        }
      }
    };
  }
}
