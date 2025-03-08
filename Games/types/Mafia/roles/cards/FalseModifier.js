const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class FalseModifier extends Card {
  constructor(role) {
    super(role);

    this.hideModifier = {
      self: true,
      death: true,
      condemn: true,
    };

    //this.startEffects = ["FalseMode"];
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Information", "WhenDead"])) {
          if (
            this.FalseModeEffect == null ||
            !this.players.effects.includes(this.FalseModeEffect)
          ) {
            this.FalseModeEffect = this.player.giveEffect(
              "FalseMode",
              Infinity
            );
            this.player.passiveEffects.push(this.FalseModeEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(this.FalseModeEffect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          if (this.FalseModeEffect != null) {
            this.FalseModeEffect.remove();
            this.FalseModeEffect = null;
          }
        }
      },
    };
  }
};
