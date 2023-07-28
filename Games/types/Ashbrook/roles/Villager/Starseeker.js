const Role = require("../../Role");

module.exports = class Starseeker extends Role {
  constructor(player, data) {
    super("Starseeker", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnRoleIfKilledAtNight"];
  }
};
