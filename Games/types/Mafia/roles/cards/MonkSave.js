const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class MonkSave extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Monk Save": {
        actionName: "Save",
        states: ["Night"],
        flags: ["voting"],
        action: {
          labels: ["save"],
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            this.target.giveEffect("Lynch Immune", 3, 2);
            this.heal(1);

            if (
              this.getVisitors(this.target, "kill", undefined, true).length > 0
            ) {
              this.actor.role.data.saveTarget = this.target;
            }
          },
        },
      },
    };

    this.listeners = {
      afterActions: function (actions) {
        if (
          this.player.role.data.saveTarget &&
          this.player.role.data.saveTarget.alive
        ) {
          if (!this.player.role.data.savedPlayers) {
            this.player.role.data.savedPlayers = [];
          }
          this.player.role.data.savedPlayers.push(
            this.player.role.data.saveTarget
          );
        }
        this.player.role.data.saveTarget = null;
      },
    };
  }
};