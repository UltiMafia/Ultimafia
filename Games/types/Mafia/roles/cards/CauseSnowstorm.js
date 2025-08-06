const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class CauseSnowstorm extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Cause Snowstorm": {
        actionName: "Cause Snowstorm?",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.causedSnowstorm;
        },
        action: {
          role: this.role,
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target === "Yes") {
              this.role.causedSnowstorm = true;
              if (!this.role.hasAbility(["Effect"])) {
                return;
              }
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
