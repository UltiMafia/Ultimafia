const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class LearnParticularFollower extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let follower = this.game.players.filter((p) => p.role.alignment == "Follower");
        if (follower.length == 0){
          this.player.queueAlert(`You learn that there are no followers in play!`);
        } else {
          let chosenFollower = Random.randArrayVal(follower);
          let followerRole = chosenFollower.role.name;
          let otherPlayer = this.game.players.filter((p) => p != chosenFollower);
          var chosenTwo = [
            chosenFollower,
            Random.randArrayVal(otherPlayer),
          ];

          if (this.player.hasEffect("Insanity")){
            var chosenTwo = [
              Random.randArrayVal(this.game.players, true),
              Random.randArrayVal(this.game.players, true),
            ];
          }

          chosenTwo = Random.randomizeArray(chosenTwo);

          this.player.queueAlert(`You learn that one of ${chosenTwo[0].name} and ${chosenTwo[1].name} is ${followerRole}!`);
        }
      }
    };
  }
}
