const Role = require("../../Role");

module.exports = class Parasite extends Role {
  constructor(player, data) {
    super("Parasite", player, data);

    this.alignment = "Leader";
    this.cards = ["VillageCore", "WinWithEvil", "NightKiller", "LeechForLife"];
  }
};
