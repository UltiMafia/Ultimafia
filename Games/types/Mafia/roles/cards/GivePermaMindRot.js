const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class GivePermaMindRot extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      death: function (player, killer, instant) {
        if (player == this.player) {
          let alive = this.game.alivePlayers();
          var villagePlayers = alive.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Village");
          var villageTarget = Random.randArrayVal(villagePlayers);
          villageTarget.holdItem("PermaMindRot");
          //villageTarget.holdItem("Gun");
        }
      },
    };
  }
};
