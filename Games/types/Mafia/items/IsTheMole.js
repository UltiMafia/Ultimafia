const Item = require("../Item");
const Action = require("../Action");
const Player = require("../../../core/Player");
const Random = require("../../../../lib/Random");
const { PRIORITY_FULL_DISABLE } = require("../const/Priority");

module.exports = class IsTheMole extends Item {
  constructor(originalFaction) {
    super("IsTheMole");

    this.lifespan = Infinity;
    this.originalFaction = originalFaction;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    this.listeners = {
      handleWinWith: function (winners) {
        this.holder.role.name = "Mole";
        winners.removePlayer(this.holder, this.holder.faction);
        this.holder.faction = originalFaction;
        if (this.holder.faction == "Independent") {
          this.holder.faction = "Village";
        }
        if (winners.groups[this.holder.faction]) {
          winners.addPlayer(this.holder, this.holder.faction);
        }
      },
    };
  }
};
