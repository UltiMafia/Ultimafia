const Role = require("../../Role");

module.exports = class Klutz extends Role {
  constructor(player, data) {
    super("Klutz", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ChoosePlayerOnDeath"];
    this.meetingMods = {
      "Choose Player": {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
