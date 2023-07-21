const Role = require("../../Role");

module.exports = class Villager8 extends Role {
  constructor(player, data) {
    super("Villager8", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "LearnRoleIfKilledAtNight"];
  }
};
