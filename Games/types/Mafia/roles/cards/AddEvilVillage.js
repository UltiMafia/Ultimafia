const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddEvilVillage extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      ReplaceAlways: function (player) {
        if (player != this.player) return;
        let VillagePlayers = this.game.players.filter(
          (p) =>
            p.role.alignment == "Village" &&
            p.faction == "Village" &&
            !p.role.data.banished
        );
        var villageTarget = Random.randArrayVal(VillagePlayers);
        for (let item of villageTarget.items) {
          item.drop();
        }
        let role = `${villageTarget.role.name}:${villageTarget.role.modifier}`;
        villageTarget.setRole(
          role,
          undefined,
          false,
          true,
          false,
          "Evil",
          "RemoveStartingItems"
        );
        villageTarget.giveEffect("Evil");
      },
    };
  }
};
