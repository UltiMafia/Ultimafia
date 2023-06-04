const Role = require("../../Role");

module.exports = class Chef extends Role {
  constructor(player, data) {
    super("Chef", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BanquetInvite"];
  }
};
