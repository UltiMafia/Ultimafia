const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const Action = require("../../Action");
const { PRIORITY_BLOCK_EARLY } = require("../../const/Priority");

module.exports = class BlockedFearful extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Blind"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Blocking", "OnlyWhenAlive"])) {
          if (
            this.ScaryEffect == null ||
            !this.player.effects.includes(this.ScaryEffect)
          ) {
            this.ScaryEffect = this.player.giveEffect("Scary", Infinity);
            this.passiveEffects.push(this.ScaryEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.ScaryEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.ScaryEffect != null) {
            this.ScaryEffect.remove();
            this.ScaryEffect = null;
          }
        }
      },
      state: function (stateInfo) {
        if (!stateInfo.name.match(/Night/)) {
          return;
        }
        var action = new Action({
          actor: this.player,
          game: this.player.game,
          priority: PRIORITY_BLOCK_EARLY,
          labels: ["block", "hidden"],
          run: function () {
            //this.actor.hasEffect("Scary");

            if (this.actor.hasEffect("Scary")) {
              for (let player of this.game.players) {
                if (player.role.modifier && player.role.modifier.split("/").includes("Fearful")) {
                  this.blockActions(player);
                }
              }
            }
          },
        });

        this.game.queueAction(action);
      },
    };
  }
};
