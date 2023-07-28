const Role = require("../../Role");

module.exports = class Troublemaker extends Role {
  constructor(player, data) {
    super("Troublemaker", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "SkipNight"];
  }
};
