const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class GuardianAngel extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Guardian: {
        states: ["Night"],
        flags: ["voting"],
        shouldMeet: function () {
          return !this.data.angelTarget;
        },
        action: {
          labels: ["guardian", "hidden", "absolute"],
          priority: PRIORITY_EFFECT_GIVER_DEFAULT,
          run: function () {
            this.actor.role.data.angelTarget = this.target;
          },
        },
      },
    };
    this.listeners = {
      beforeAction: function (action) {
        if (
          this.player.alive &&
          action.hasLabel("kill") &&
          action.target === this.data.angelTarget
        ) {
          action.target = this.player;
        }
      },
    };
  }
};
