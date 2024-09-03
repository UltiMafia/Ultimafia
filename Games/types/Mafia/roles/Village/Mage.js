const Role = require("../../Role");

module.exports = class Mage extends Role {
  constructor(player, data) {
    super("Mage", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "KillVillagePlayerOnDeath"];
    this.meetingMods = {
      "Choose Player": {
        whileDead: true,
        whileAlive: true,
      },
    };
  }
};
