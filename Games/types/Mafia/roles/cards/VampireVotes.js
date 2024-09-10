const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class VampireVotes extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (!this.player.alive) return;
        if (stateInfo.name.match(/Day/)) {
          this.player.role.data.VotingLog = [];
        }
      },
      vote: function (vote) {
        if (!this.player.alive) return;
        if (vote.meeting.name === "Village" && vote.target === vote.voter) {
          if (
            vote.voter.role.alignment == "Village" &&
            Random.randInt(0, 100) <= 30
          ) {
            let action = new Action({
              actor: this.player,
              target: vote.voter,
              game: this.game,
              labels: ["kill", "curse", "hidden"],
              power: 2,
              run: function () {
                if (this.dominates())
                  this.target.kill("curse", this.actor, true);
              },
            });

            this.game.instantAction(action);
          }
        } else if (vote.meeting.name === "Village") {
          let votes = this.player.role.data.VotingLog;

          for (let y = 0; y < votes.length; y++) {
            if (votes[y].voter == vote.voter) {
              if (
                vote.voter.role.alignment == "Village" &&
                Random.randInt(0, 100) <= 30
              ) {
                let action = new Action({
                  actor: this.player,
                  target: vote.voter,
                  game: this.game,
                  labels: ["kill", "curse", "hidden"],
                  power: 2,
                  run: function () {
                    if (this.dominates())
                      this.target.kill("curse", this.actor, true);
                  },
                });

                this.game.instantAction(action);
              }
              return;
            }
          }
          this.player.role.data.VotingLog.push(vote);
        }
      },
    };
  }
};
