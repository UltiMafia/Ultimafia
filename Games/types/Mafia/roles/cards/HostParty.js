const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");

module.exports = class HostParty extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Host Party": {
        actionName: "Host a Party?",
        states: ["Day"],
        flags: ["voting"],
        inputType: "boolean",
        shouldMeet: function () {
          return !this.hostedParty;
        },
        action: {
          role: this.role,
          priority: PRIORITY_DAY_EFFECT_DEFAULT,
          run: function () {
            if (this.target == "Yes") {
              this.role.hostedParty = true;
              if (!this.actor.hasAbility(["Meeting"])) {
                return;
              }
              for (let player of this.game.players) {
                player.holdItem("Flier");
              }
            }
          },
        },
      },
    };
  }
};
