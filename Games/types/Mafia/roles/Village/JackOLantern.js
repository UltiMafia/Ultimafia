const Role = require("../../Role");

module.exports = class JackOLantern extends Role {
  constructor(player, data) {
    super("Jack O'Lantern", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "HostHalloweenParty"];
  }
};
