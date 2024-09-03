const Role = require("../../Role");

module.exports = class Mooncalf extends Role {
  constructor(player, data) {
    super("Mooncalf", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "KillVillagePlayerOnDeath"];
    this.meetingMods = {
      "Choose Player": {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
