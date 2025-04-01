const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class Pranked extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      vote: function (vote) {
        if (vote.meeting.name === "Village" && vote.target === this.player.id) {
          if (this.player.role.data.hasBeenVoted == true) return;

          this.player.role.data.hasBeenVoted = true;
          this.player.role.data.playerVoter = 0;
          if (!this.player.hasAbility(["Convert"])) {
            return;
          }
          this.player.role.data.playerVoter = vote.voter;

          var action = new Action({
            actor: this.player,
            target: this.player.role.data.playerVoter,
            game: this.player.game,
            priority: PRIORITY_OVERTHROW_VOTE - 1,
            labels: ["hidden", "convert"],
            run: function () {
              if (this.dominates(this.actor.role.data.playerVoter)) {
                this.target.setRole("Fool");
              }
              this.actor.role.data.playerVoter = 0;
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
