const Role = require("../../Role");

module.exports = class Benandante extends Role {
  constructor(player, data) {
    super("Benandante", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "ChoosePlayerOnDeath",
    ];
    this.meetingMods = {
      "Choose Player": {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
