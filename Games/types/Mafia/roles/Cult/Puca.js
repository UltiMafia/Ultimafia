const Role = require("../../Role");

module.exports = class Puca extends Role {
  constructor(player, data) {
    super("Puca", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "PucaPoison",
    ];
  }
};

//If renaming this change it's name in poison.js as well.
