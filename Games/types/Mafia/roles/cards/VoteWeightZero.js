const Card = require("../../Card");

module.exports = class VoteWeightZero extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Voting"])) {
          this.player.role.VotePower = 0;
        } else {
          this.player.role.VotePower = 1;
        }
      },
    };
  }
};
