const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class IfVotedForceCondemn extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      vote: function (vote) {
        if (vote.meeting.useVotingPower == true && vote.target === this.player.id) {
          if (this.data.hasBeenVoted == true) return;

          this.data.hasBeenVoted = true;
          this.data.playerVoter = 0;
          if (!this.hasAbility(["Condemn"])) {
            return;
          }
          /*
          if (
            this.game.getRoleAlignment(
              vote.voter.getRoleAppearance().split(" (")[0]
            ) != "Village"
          ) {
            return;
          }
          */
          if (!this.canTargetPlayer(vote.voter)) {
            return;
          }
          this.data.playerVoter = vote.voter;

          var action = new Action({
            actor: this.player,
            target: this.data.playerVoter,
            game: this.player.game,
            priority: PRIORITY_OVERTHROW_VOTE - 1,
            role: this.role,
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

              if (this.dominates(this.role.data.playerVoter)) {
                this.target.kill("condemn", this.actor);
              }
              this.role.data.playerVoter = 0;
            },
          });
          this.game.queueAction(action);
          for (const player of this.game.players) {
            player.giveEffect("Unveggable");
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
