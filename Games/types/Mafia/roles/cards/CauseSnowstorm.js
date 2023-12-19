const Card = require("../../Card");
const { PRIORITY_PARTY_MEETING } = require("../../const/Priority");

module.exports = class CauseSnowstorm extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Cause Snowstorm?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.causedSnowstorm;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run: function () {
            if (this.target === "Yes") {
              this.actor.role.causedSnowstorm = true;
              this.game.queueAlert(":snowball: A snowstorm is approaching…");
              for (const player of this.game.players) {
                player.holdItem("Snowstorm");
              }
            }
          },
        },
      },
    };
  }
};
