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
          return !this.data.hasSkipped;
        },
        action: {
          role: this.role,
          run: function () {
            if (this.target === "No") return;
            this.role.data.hasSkipped = true;
            if (!this.role.hasAbility(["Voting"])) {
              return;
            }
            this.role.data.skipNight = true;
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
          if (this.data.skipNight) {
            this.data.skipNight = false;
            return true;
          }
          return false;
        },
      },
    };
  }
};
