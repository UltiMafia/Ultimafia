const Role = require("../../Role");

module.exports = class RobinHood extends Role {
  constructor(player, data) {
    super("Robin Hood", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "TransferItems"];
  }
};
