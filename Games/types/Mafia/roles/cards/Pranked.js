const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class Pranked extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      vote: function (vote) {
        if (
          vote.meeting.useVotingPower == true &&
          vote.target === this.player.id
        ) {
          if (this.data.hasBeenVoted == true) return;

          this.data.hasBeenVoted = true;
          this.data.playerVoter = 0;
          if (!this.hasAbility(["Convert"])) {
            return;
          }
          if (!this.canTargetPlayer(vote.voter)) {
            return;
          }
          this.data.playerVoter = vote.voter;

          var action = new Action({
            actor: this.player,
            target: this.data.playerVoter,
            game: this.player.game,
            priority: PRIORITY_OVERTHROW_VOTE - 1,
            labels: ["hidden", "convert"],
            role: this.role,
            run: function () {
              if (this.dominates(this.role.data.playerVoter)) {
                this.target.setRole("Fool");
              }
              this.role.data.playerVoter = 0;
            },
          });
          this.game.instantAction(action);
        }
      },
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }
        if (!stateInfo.name.match(/Day/)) {
          return;
        }
      },
    };
  }
};
