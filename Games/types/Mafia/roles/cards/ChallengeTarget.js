const Card = require("../../Card");

module.exports = class ChallengeTarget extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.data.meetingName = "Gamble with " + this.player.name;
      },
    };

    this.meetings = {
      "Give Challenge": {
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["challenge"],
          run: function () {
            this.target.holdItem(
              "Gamble",
              this.actor.role.data.meetingName,
              this.actor,
              this.target
            );
            this.target.queueAlert(
              ":v_cards: You received a gambling challenge!"
            );
            this.actor.holdItem(
              "Gamble",
              this.actor.role.data.meetingName,
              this.actor,
              this.target
            );
          },
        },
      },
    };
  }
};
