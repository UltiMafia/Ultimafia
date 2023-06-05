const Role = require("../../Role");

module.exports = class Journalist extends Role {
  constructor(player, data) {
    super("Journalist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ReceiveReports"];
  }
};
