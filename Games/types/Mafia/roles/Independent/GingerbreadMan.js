const Role = require("../../Role");

module.exports = class GingerbreadMan extends Role {
  constructor(player, data) {
    super("Gingerbread Man", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "HideBehindPlayer", "WinIfAlive"];
  }
};
