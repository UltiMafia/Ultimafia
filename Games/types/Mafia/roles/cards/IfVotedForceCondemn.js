const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class IfVotedForceCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      vote: function (vote) {
        if (vote.meeting.name === "Village" && vote.target === this.player.id) {
          if (this.player.role.data.hasBeenVoted == true) return;

          this.player.role.data.hasBeenVoted = true;
          this.player.role.data.playerVoter = 0;
          if (!this.player.hasAbility(["Condemn"])) {
            return;
          }
          if (
            this.game.getRoleAlignment(
              vote.voter.getRoleAppearance().split(" (")[0]
            ) != "Village"
          ) {
            return;
          }
          this.player.role.data.playerVoter = vote.voter;

          var action = new Action({
            actor: this.player,
            target: this.player.role.data.playerVoter,
            game: this.player.game,
            priority: PRIORITY_OVERTHROW_VOTE - 1,
            labels: ["hidden", "absolute", "condemn", "overthrow"],
            run: function () {
              //New code
              for (let action of this.game.actions[0]) {
                if (
                  action.hasLabel("condemn") &&
                  !action.hasLabel("overthrow")
                ) {
                  // Only one village vote can be overthrown
                  action.cancel(true);
                  break;
                }
              }

              if (this.dominates(this.actor.role.data.playerVoter)) {
                this.target.kill("condemn", this.actor);
              }
              this.actor.role.data.playerVoter = 0;
            },
          });
          this.game.queueAction(action);
          for (const player of this.game.players) {
            player.giveEffect("Unveggable", -1);
          }
          this.game.gotoNextState();
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
