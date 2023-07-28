const Role = require("../../Role");

module.exports = class Doctor extends Role {
  constructor(player, data) {
    super("Doctor", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LeaderProtector"];
  }
};
