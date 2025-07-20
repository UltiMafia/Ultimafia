const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class SetTimer extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Progress Timer": {
        actionName: "Speed Up",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hasSpeedUp;
        },
        action: {
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          role: this.role,
          run: function () {
            if (this.target === "Yes") {
              this.role.hasSpeedUp = true;
              if (!this.actor.hasAbility(["Effect"])) {
                return;
              }
              this.game.extensions = 99;
              this.game.timers["main"].set(60 * 1000);
              this.game.queueAlert(
                ":omg: Someone has decided to set the timer to 1 minute!"
              );
            }
          },
        },
      },
    };
  }
};
