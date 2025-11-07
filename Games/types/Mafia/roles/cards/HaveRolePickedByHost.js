const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");
module.exports = class HaveRolePickedByHost extends Card {
  constructor(role) {
    super(role);

    for (let player of this.game.players) {
      if (player.role && player.role.name == "Host") {
        player.giveItem("HostRoleSelection", role.player);
      }
    }
  }
};
