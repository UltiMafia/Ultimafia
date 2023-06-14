const Role = require("../../Role");

module.exports = class Host extends Role {
  constructor(player, data) {
    super("Host", player, data);

    this.alignment = "Independent";
    this.immunity.kill = Infinity;
    this.cards = [
      "VillageCore",
      "EndGameWhenOnlyOneOtherAlive",
      "EndGameAtAnyTime",
    ];
  }
};
