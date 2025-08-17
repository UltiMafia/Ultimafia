const Effect = require("../Effect");
const Action = require("../Action");
const Random = require("../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../const/Priority");
const {
  EVIL_FACTIONS,
  NOT_EVIL_FACTIONS,
  CULT_FACTIONS,
  MAFIA_FACTIONS,
  FACTION_LEARN_TEAM,
  FACTION_WIN_WITH_MAJORITY,
  FACTION_WITH_MEETING,
  FACTION_KILL,
} = require("../const/FactionList");

module.exports = class WinWith3GoldenCarps extends Effect {
  constructor(lifespan) {
    super("WinWith3GoldenCarps");
    this.lifespan = lifespan || Infinity;

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        let carps = 0;
        for (let item of this.player.items) {
          if (item.name == "Golden Carp") {
            carps += 1;
          }
        }
        if (carps >= 3) {
          winners.addPlayer(this.player, "Golden Carps");
        }
      },
    };
  }
};
