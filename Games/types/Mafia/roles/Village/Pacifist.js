const Role = require("../../Role");

module.exports = class Pacifist extends Role {
  constructor(player, data) {
    super("Pacifist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "VillageMightSurviveCondemn"];
  }
};
