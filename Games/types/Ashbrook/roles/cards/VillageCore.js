const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_VILLAGE } = require("../../const/Priority");

module.exports = class VillageCore extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Village: {
        type: "Village",
        states: ["Day"],
        targets: { include: ["alive"], exclude: [cannotBeVoted] },
        flags: ["group", "speech", "voting"],
        whileDead: true,
        speakDead: true,
        action: {
          labels: ["kill", "condemn", "hidden"],
          priority: PRIORITY_VILLAGE,
          power: 3,
          run: function () {
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        },
      },
    };

    this.listeners = {
      vote: function (vote) {
        if (this.player.alive) return;
        if (vote.meeting.name === "Village" &&
          vote.voter === this.player &&
          vote.target !== "*"){
            this.player.giveEffect("CannotVote");
            this.player.queueAlert("You have used your final vote! You may no longer vote for the rest of the game!");
        }
      },
      death: function (player, killer, deathType){
        if (player != this.player) return;

        player.queueAlert("Now that you have died, you have one vote left that you can use on another player. Use it wisely!");
      },
      state: function (stateInfo) {
        if (stateInfo.name.match(/Night/)){
          if (!this.game.dayAnnounce) this.game.dayAnnounce = true;
          if (!this.game.enableWhisper) this.game.enableWhisper = true;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        if (this.game.getStateInfo().id == 1){
          if (this.game.dayAnnounce){
            this.game.queueAlert("I, the Narrator was killed during the night. Find the Leader and avenge me!");
            this.game.queueAlert("Feel free to talk amongst each other! For the first half of the day, you can talk in groups or in private!");
          }
        }

        if (this.game.dayAnnounce) {
          let timeLength = this.game.stateLengths["Day"] / 2;
          this.timer = setTimeout(() => {
            let action = new Action({
              actor: this.player,
              game: this.player.game,
              run: function () {
                if (!this.game.getStateInfo().name.match(/Day/)) return;

                this.game.enableWhisper = false;
                if (this.dominates()) this.game.queueAlert("It is around half way through the day! Return to the town and decide on the vote! (For the rest of the day, your whispers will leak)");
              },
            });

            this.game.instantAction(action);
          }, timeLength);

          this.game.dayAnnounce = false;
        }
      }
    }
  }
};

function cannotBeVoted(player) {
  return player.hasEffect("CannotBeVoted") || !player.alive;
}
