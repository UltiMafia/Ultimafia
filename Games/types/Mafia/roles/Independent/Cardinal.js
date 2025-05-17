const Role = require("../../Role");

module.exports = class Cardinal extends Role {
  constructor(player, data) {
    super("Cardnals", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinWithDesiredPope", "Conclave"];
  }
};
