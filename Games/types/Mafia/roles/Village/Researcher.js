const Role = require("../../Role");

module.exports = class Researcher extends Role {
  constructor(player, data) {
    super("Researcher", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "LearnAboutPlayerAndRole"];
  }
};
