const Role = require("../../Role");

module.exports = class Mason extends Role {
  constructor(player, data) {
    super("Mason", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RevealSameRole"];
  }
};
