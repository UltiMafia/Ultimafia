const Card = require("../../Card");

module.exports = class KillImmune extends Card {
  constructor(role) {
    super(role);
    /*
    this.startEffects = [
      {
        type: "Kill Immune",
        args: [5],
      },
    ];
    */
    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "OnlyWhenAlive"])) {
          if (
            this.UnkillableEffect == null ||
            !this.player.effects.includes(this.UnkillableEffect)
          ) {
            this.UnkillableEffect = this.player.giveEffect(
              "Kill Immune",
              5,
              Infinity
            );
            this.passiveEffects.push(this.UnkillableEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.UnkillableEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.UnkillableEffect != null) {
            this.UnkillableEffect.remove();
            this.UnkillableEffect = null;
          }
        }
      },
    };
  }
};
