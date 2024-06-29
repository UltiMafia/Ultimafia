const Role = require("../../Role");

module.exports = class Dentist extends Role {
  constructor(player, data) {
    super("Dentist", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAmongLastTwo", "NightGasser"];
  }
};
