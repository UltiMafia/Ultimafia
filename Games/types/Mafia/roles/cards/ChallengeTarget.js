const Card = require("../../Card");

module.exports = class ChallengeTarget extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        this.player.queueAlert(
          ":dice6: Everything this Village does is based on chance. Show them the odds and prove that the house doesn't always win."
        );
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
              "You are challenged to a life-or-death gamble!"
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
