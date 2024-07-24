const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class GiveShavingCreamOnDeath extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      death: function (player, killer, instant) {
        if (player == this.player) {
          var evilPlayers = alive.filter(
            (p) =>
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Cult" ||
              this.game.getRoleAlignment(
                p.getRoleAppearance().split(" (")[0]
              ) == "Mafia"
          );
          var evilTarget = Random.randArrayVal(evilPlayers);
          evilTarget.holdItem("Shaving Cream");
          evilTarget.queueGetItemAlert("Shaving Cream");
        }
      },
    };
  }
};
