const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Clueless extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Scrambled"];

    this.hideModifier = {
      self: true,
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.player.hasAbility(["Modifier", "Voting"])) {
          if (
            this.VotingNegativeEffect == null ||
            !this.player.effects.includes(this.VotingNegativeEffect)
          ) {
            this.VotingNegativeEffect = this.player.giveEffect("VoteNegative", Infinity);
            this.player.passiveEffects.push(this.VotingNegativeEffect);
          }
        } else {
          var index = this.player.passiveEffects.indexOf(this.VotingNegativeEffect);
          if (index != -1) {
            this.player.passiveEffects.splice(index, 1);
          }
          if (this.VotingNegativeEffect != null) {
            this.VotingNegativeEffect.remove();
            this.VotingNegativeEffect = null;
          }
        }
      },
    };
  }
};
