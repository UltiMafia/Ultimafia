const Card = require("../../Card");

module.exports = class Lone extends Card {
  constructor(role) {
    super(role);

    shouldMeet: function () {
      if (this.actor.alignment === "Mafia") {        
        this.meetings = {
        "Become Mafioso": {
          states: ["Night"],
          flags: ["voting"],
          inputType: "boolean",
          action: {
              labels: ["convert"],
              priority: PRIORITY_MAFIA_KILL,
              run: function () {
                if (this.target === "No")
                  return;
                  this.actor.setRole(`Mafioso`);
                },
              },
            },
          };
        }
      return false;
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
      "Learn Alignment": {
        flags: ["voting"],
      },
    };
  }
};
