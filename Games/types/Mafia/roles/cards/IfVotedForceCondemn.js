const Card = require("../../Card");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class IfVotedForceCondemn extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_OVERTHROW_VOTE -1,
        labels: ["hidden", "absolute","condemn","overthrow"],
        run: function () {
          if (this.game.getStateName() != "Day") return;

          //let villageMeeting = this.game.getMeetingByName("Village");
          
          if (
            !this.actor.role.data.hasBeenVoted ||
            this.actor.role.data.playerVoter == 0
          ) {
            return;
          }
          
          //New code
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {

              // Only one village vote can be overthrown
              action.cancel(true);
              break;
            }
          }
          
          if (this.dominates(this.actor.role.data.playerVoter)) {
            this.actor.role.data.playerVoter.kill("condemn", this.actor);
          }
          this.actor.role.data.playerVoter = 0;

          /* Old code
          if (villageMeeting.finalTarget === this.actor) {
            return;
          }

          // check if it was a target
          let targeted = false;
          for (let key in villageMeeting.votes) {
            let target = villageMeeting.votes[key];
            if (target === this.actor.id) {
              targeted = true;
              break;
            }
          }
          if (!targeted) {
            return;
          }

          let action = new Action({
            actor: this.actor,
            target: this.actor,
            game: this.game,
            labels: ["kill", "frustration", "hidden"],
            power: 3,
            run: function () {
              this.game.sendAlert(
                `${this.target.name} feels immensely frustrated!`
              );
              if (this.dominates()) this.target.kill("basic", this.actor);
            },
          });
          action.do();
          */
        },
      },
    ];

    this.listeners = {
      vote: function (vote) {
        if (vote.meeting.name === "Village" && vote.target === this.player.id) {
          if (this.player.role.data.hasBeenVoted) return;

          this.player.role.data.hasBeenVoted = true;
          this.player.role.data.playerVoter = 0;

          if (
            this.game.getRoleAlignment(
              vote.voter.getRoleAppearance().split(" (")[0]
            ) != "Village"
          ) {
            return;
          }
          this.player.role.data.playerVoter = vote.voter;
          /*
          for (const player of this.game.alivePlayers()) {
            player.giveEffect("CannotBeVoted", 1);
            player.giveEffect("CannotVote", 1);
            player.giveEffect("CannotChangeVote", 1);
          }
          vote.voter.kill("condemn", this.player, true);
          */
        }
      },
    };
  }
};
