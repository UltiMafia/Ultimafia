const Card = require("../../Card");

module.exports = class WinWithMinions extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check(winners, dead, werewolfPresent) {
        if (werewolfPresent && (dead.roles.Werewolf || 0) == 0)
          winners.addPlayer(this.player, "Werewolves");
        else if (!werewolfPresent) {
          let nonMinionDied = false;

          for (const role in dead.roles) {
            if (role != "total" && role != "Minion") {
              nonMinionDied = true;
              break;
            }
          }

          if (nonMinionDied) winners.addPlayer(this.player, "Werewolves");
        }
      },
    };
  }
};
