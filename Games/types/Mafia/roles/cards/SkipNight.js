const Card = require("../../Card");

module.exports = class SkipNight extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Skip Night?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.player.role.data.hasSkipped;
        },
        action: {
          run: function () {
            if (this.target === "No") return;
            this.actor.role.data.hasSkipped = true;
            this.actor.role.data.skipNight = true;
            this.game.queueAlert(
              "A troublemaker is making a ruckus! The Town will not be able to sleep tonight…"
            );
          },
        },
      },
    };
    this.stateMods = {
      Night: {
        type: "shouldSkip",
        shouldSkip: function () {
          if (this.player.role.data.skipNight) {
            this.player.role.data.skipNight = false;
            return true;
          }
          return false;
        },
      },
    };
  }
};
