const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class BlindAll extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Blind All": {
        actionName: "Turn off the lights?",
        states: ["Day"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hasBlinded;
        },
        action: {
          role: this.role,
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target === "Yes") {
              this.role.hasBlinded = true;
              if (!this.role.hasAbility(["Effect"])) {
                return;
              }
              this.game.queueAlert(
                ":omg: Someone turns out the lights… nobody can see!"
              );
              for (const player of this.game.alivePlayers()) {
                player.giveEffect("Blind", -1);
              }
            }
          },
        },
      },
    };
  }
};
