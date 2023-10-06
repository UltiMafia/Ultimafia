const Card = require("../../Card");

module.exports = class WinWithWerewolves extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check: function (winners, dead, werewolfPresent) {
        if ((dead.roles["Werewolf"] || 0) == 0)
          winners.addPlayer(this.player, "Werewolves");
      },
    };
  }
};
