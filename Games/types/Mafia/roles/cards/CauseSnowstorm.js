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
          return !this.data.causedSnowstorm;
        },
        action: {
          priority: PRIORITY_PARTY_MEETING,
          run: function () {
            if (this.target === "Yes") {
              this.actor.role.data.causedSnowstorm = true;
              this.game.queueAlert(":sy8b: A snowstorm is approaching...");
              for (const player of this.game
                .alivePlayers()
                .filter(
                  (e) => e.role.alignment !== this.actor.role.alignment
                )) {
                if (!player.hasEffect("Snowstorm")) {
                  player.giveEffect("Snowstorm");
                }
              }
              for (const player of this.game.players) {
                if (!player.hasItem("Snowstorm")) {
                  player.holdItem("Snowstorm");
                }
              }
            }
          },
        },
      },
    };
  }
};