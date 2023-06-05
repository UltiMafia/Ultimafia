const Role = require("../../Role");

module.exports = class PartyHost extends Role {
  constructor(player, data) {
    super("Party Host", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "HostParty"];
  }
};
