const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AddEvilVillage extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      ReplaceAlways: function (player) {
        if (player != this.player) return;
        let VillagePlayers = this.game.players.filter((p) => p.role.alignment == "Village" && p.faction == "Village" && !p.role.data.banished);
        var villageTarget = Random.randArrayVal(villagePlayers);
        for (let item of villageTarget[0].items) {
          item.drop();
        }
        let role = `${villageTarget.role.name}:${villageTarget.role.modifier}`;
          villageTarget.setRole(
          villageTarget.role.,
          undefined,
          false,
          true,
          false,
          "Evil"
        );
        villageTarget.giveEffect("Evil");
      },
    };

  }
};
