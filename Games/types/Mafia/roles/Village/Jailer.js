const Role = require("../../Role");

module.exports = class Jailer extends Role {
  constructor(player, data) {
    super("Jailer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "JailTarget"];
  }
};
