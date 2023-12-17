//do it right or don't do it at all
const Card = require("../../Card");
const {
  PRIORITY_PARTY_MEETING,
  PRIORITY_OVERTHROW_VOTE,
} = require("../../const/Priority");

module.exports = class CourtSession extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Call Court?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run: function () {
            if (this.target === "Yes") {
              this.actor.role.bangedGavel++;
              this.game.queueAlert(
                ":hammer: You've been assigned jury duty..."
              );
              for (const player of this.game.players) {
                player.holdItem("JuryDuty");
              }
            }
          },
        },
      },
      Court: {
        meetingName: "Court Session",
        states: ["Court"],
        flags: ["group", "speech", "voting", "anonymous", "MustAct"],
        targets: { include: ["alive"], exclude: ["dead", "self"] },
        leader: true,
        action: {
          power: 3,
          labels: ["kill", "condemn", "overthrow"],
          priority: PRIORITY_OVERTHROW_VOTE,
          run: function () {
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                if (action.target === this.target) {
                  return;
                }

                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
            }

            if (this.dominates()) {
              this.target.kill("condemn", this.actor);
            }

            this.actor.role.courtAdjourned++;
          },
        },
      },
    };

    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Court: {
        type: "add",
        index: 4,
        length: 1000 * 30,
        shouldSkip: function () {
          if (this.bangedGavel >= 2) {
            return false;
          }
          if (this.courtAdjourned <= 2) {
            return true;
          }
          if (!this.player.alive) {
            return true;
          }
          return true;
        },
      },
    };
  }
};
