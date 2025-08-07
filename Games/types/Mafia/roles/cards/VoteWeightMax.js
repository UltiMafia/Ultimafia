const Card = require("../../Card");

module.exports = class VoteWeightMax extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (player != this.player) {
          return;
        }
        if (this.hasAbility(["Voting"])) {
          this.player.role.VotePower = 10000;
        } else {
          this.player.role.VotePower = 1;
        }
      },
    };
  }
};
