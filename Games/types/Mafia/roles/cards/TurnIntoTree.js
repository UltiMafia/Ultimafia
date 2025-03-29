const Card = require("../../Card");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class TurnIntoTree extends Card {
  constructor(role) {
    super(role);
    this.meetings = {
      "Grow Into Tree?": {
        states: ["Night"],
        flags: ["voting"],
        inputType: "boolean",
        action: {
          priority: PRIORITY_NIGHT_SAVER,
          run: function () {
            if (this.target == "No") return;
            if (this.target === "Yes") {
              //this.actor.giveEffect("Tree", 1);
              this.actor.role.isTree = true;
              this.game.events.emit("AbilityToggle", this.actor);
            }
          },
        },
        shouldMeet() {
          return !this.isTree;
        },
      },
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (
          this.player.hasAbility(["Tree"]) &&
          this.player.role.isTree == true
        ) {
          if (
            this.TreeEffect == null ||
            !this.player.effects.includes(this.TreeEffect)
          ) {
            this.TreeEffect = this.player.giveEffect("Tree", 1, Infinity);
            this.player.passiveEffects.push(this.TreeEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(this.TreeEffect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          if (this.TreeEffect != null) {
            this.TreeEffect.remove();
            this.TreeEffect = null;
          }
        }
      },
    };
  }
};
