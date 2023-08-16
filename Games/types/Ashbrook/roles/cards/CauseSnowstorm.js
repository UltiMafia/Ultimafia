const Card = require("../../Card");
const { PRIORITY_FOLLOWER } = require("../../const/Priority");

module.exports = class CauseSnowstorm extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Cause Snowstorm?": {
        states: ["Day"],
        flags: ["voting", "instant"],
        whileDead: true,
        inputType: "boolean",
        shouldMeet: function () {
          return !this.data.causedSnowstorm && (this.player.alive || (!this.player.alive && this.player.hasItem("DeadAbilityUser")));
        },
        action: {
          priority: PRIORITY_FOLLOWER,
          run: function () {
            if (this.target === "Yes") {
              this.actor.role.data.causedSnowstorm = true;

              if (this.isInsane()) return;
              
              this.game.queueAlert(":sy8b: A snowstorm is approaching...");
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
