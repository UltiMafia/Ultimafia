const Effect = require("../Effect");
const Action = require("../Action");
const { PRIORITY_OVERTHROW_VOTE } = require("../const/Priority");

module.exports = class Frustrated extends Effect {
  constructor(lifespan) {
    super("Frustrated");
    this.lifespan = lifespan || Infinity;
    this.immunity["condemn"] = 3;

    this.listeners = {
      /*
      state: function (stateInfo) {
        if (!this.player.alive) {
          return;
        }

        if (!stateInfo.name.match(/Day/)) {
          return;
        }

        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_OVERTHROW_VOTE - 3,
          labels: ["hidden", "absolute"],
          run: function () {
            //if (this.game.getStateName() != "Day" && this.game.getStateName() != "Dusk") return;

            let villageMeeting = this.game.getMeetingByName("Village");

            //New code
            const voteCounts = Object.values(villageMeeting.votes).reduce(
              (acc, vote) => {
                acc[vote] = (acc[vote] || 0) + 1;
                return acc;
              },
              {}
            );

            const minVotes = Math.min(...Object.values(voteCounts));
            const maxVotes = Math.max(...Object.values(voteCounts));

            if (
              voteCounts[this.actor.id] !== minVotes ||
              voteCounts[this.actor.id] === maxVotes ||
              voteCounts[this.actor.id] === 0
            ) {
              return;
            }

            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
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
          },
        });

        this.game.queueAction(action);
      },
      */
      PostVotingPowers: function (meeting, count, highest) {
        const voteCounts = Object.values(meeting.votes).reduce((acc, vote) => {
          acc[vote] = (acc[vote] || 0) + 1;
          return acc;
        }, {});

        const minVotes = Math.min(...Object.values(voteCounts));
        const maxVotes = Math.max(...Object.values(voteCounts));

        if (
          voteCounts[this.player.id] !== minVotes ||
          voteCounts[this.player.id] === maxVotes ||
          voteCounts[this.player.id] === 0
        ) {
          return;
        }

        let action = new Action({
          actor: this.actor,
          target: this.actor,
          game: this.game,
          labels: ["kill", "frustration", "hidden"],
          power: 3,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
            }
            this.game.sendAlert(
              `${this.target.name} feels immensely frustrated!`
            );
            if (this.dominates()) this.target.kill("condemn", this.actor);
          },
        });
        this.game.queueAction(action);
      },
    };
  }
};
