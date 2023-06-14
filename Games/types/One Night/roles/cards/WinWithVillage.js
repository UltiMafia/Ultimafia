const Card = require("../../Card");

module.exports = class WinWithVillage extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check(winners, dead, werewolfPresent) {
        if (
          (werewolfPresent && (dead.roles.Werewolf || 0) > 0) ||
          (!werewolfPresent && dead.total - (dead.roles.Minion || 0) == 0)
        ) {
          winners.addPlayer(this.player, "Village");
        }
      },
    };
  }
};
