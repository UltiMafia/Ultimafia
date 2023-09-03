const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class Lone extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Become Mafioso": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          labels: ["convert"],
          priority: PRIORITY_CONVERT_DEFAULT,
          run: function () {
            if (this.target === "No") return;
            this.actor.setRole("Mafioso");
            this.actor.queueAlert(
              "You forgo your mission and return to the jazz lounge..."
            );
          },
        },
        shouldMeet: function () {
          return this.alignment == "Mafia";
        },
      },
    };

    this.meetingMods = {
      Mafia: {
        disabled: true,
      },
      Cult: {
        disabled: true,
      },
      "Templar Meeting": {
        disabled: true,
      },
    };
  }
};
