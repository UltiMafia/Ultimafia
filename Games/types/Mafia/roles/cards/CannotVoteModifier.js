const Card = require("../../Card");

module.exports = class CannotVoteModifier extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["CondemnImmune"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier"])) {
          if (
            this.CannotBeVotedEffect == null ||
            !this.player.effects.includes(this.CannotBeVotedEffect)
          ) {
            this.CannotBeVotedEffect = this.player.giveEffect(
              "CannotVote",
              Infinity,
              "Village"
            );
            this.passiveEffects.push(this.CannotBeVotedEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.CannotBeVotedEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.CannotBeVotedEffect != null) {
            this.CannotBeVotedEffect.remove();
            this.CannotBeVotedEffect = null;
          }
        }
      },
    };
  }
};
