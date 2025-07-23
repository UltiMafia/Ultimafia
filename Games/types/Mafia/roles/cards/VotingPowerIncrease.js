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
        let votePower = 0;
        for (let modifier of this.player.role.modifier.split("/")) {
          if (modifier == "Trustworthy") {
            votePower++;
          }
        }
        if (this.player.hasAbility(["Modifier", "Voting"])) {
          if (
            this.VotingIncreaseEffect == null ||
            !this.player.effects.includes(this.VotingIncreaseEffect)
          ) {
            this.VotingIncreaseEffect = this.player.giveEffect(
              "VoteIncrease",
              Infinity,
              votePower
            );
            this.passiveEffects.push(this.VotingIncreaseEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(
            this.VotingIncreaseEffect
          );
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.VotingIncreaseEffect != null) {
            this.VotingIncreaseEffect.remove();
            this.VotingIncreaseEffect = null;
          }
        }
      },
    };
  }
};
