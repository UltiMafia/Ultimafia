const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Clueless extends Card {
  constructor(role) {
    super(role);

    //this.startEffects = ["Scrambled"];

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Modifier", "Voting"])) {
          if (
            this.VotingZeroEffect == null ||
            !this.player.effects.includes(this.VotingZeroEffect)
          ) {
            this.VotingZeroEffect = this.player.giveEffect(
              "Voteless",
              Infinity
            );
            this.passiveEffects.push(this.VotingZeroEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.VotingZeroEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.VotingZeroEffect != null) {
            this.VotingZeroEffect.remove();
            this.VotingZeroEffect = null;
          }
        }
      },
    };
  }
};
