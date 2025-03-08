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
        if (this.player.hasAbility(["Modifier", "OnlyWhenAlive"])) {
          if (
            this.UnkillableEffect == null ||
            !this.players.effects.includes(this.UnkillableEffect)
          ) {
            this.UnkillableEffect = this.player.giveEffect("Kill Immune", 5, Infinity);
            this.player.passiveEffects.push(this.UnkillableEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(this.UnkillableEffect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
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
