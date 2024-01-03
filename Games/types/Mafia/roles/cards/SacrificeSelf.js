const Card = require("../../Card");
const { PRIORITY_OVERTHROW_VOTE } = require("../../const/Priority");

module.exports = class SacrificeSelf extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Sacrifice Self": {
        states: ["Overturn"],
        flags: ["group", "speech", "voting", "anonymousVotes"],
        inputType: "boolean",
        leader: true,
        action: {
          power: 3,
          labels: ["kill", "condemn", "overthrow"],
          priority: PRIORITY_OVERTHROW_VOTE,
          run: function () {
            if (this.target == "No") return;
            for (let action of this.game.actions[0]) {
              if (action.hasLabel("condemn") && !action.hasLabel("overthrow")) {
                if (action.target === this.actor) {
                  return;
                }

                // Only one village vote can be overthrown
                action.cancel(true);
                break;
              }
            }

            if (this.dominates()) {
              this.actor.kill("condemn", this.actor);
            }
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
        type: "add",
        index: 4,
        length: 1000 * 30,
        shouldSkip: function () {
          if (!this.player.alive) {
            return true;
          }

          let isNoVote = true;
          for (let action of this.game.actions[0]) {
            if (action.hasLabel("condemn")) {
              isNoVote = false;
              break;
            }
          }

          if (isNoVote) {
            return true;
          }

          for (let player of this.game.players) {
            if (!player.hasItem("OverturnSpectator")) {
              player.holdItem("OverturnSpectator");
            }
          }
          return false;
        },
      },
    };
  }
};
