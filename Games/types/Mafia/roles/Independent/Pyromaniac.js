const Role = require("../../Role");

module.exports = class Pyromaniac extends Role {
  constructor(player, data) {
    super("Pyromaniac", player, data);
    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinUponPyromaniacMajority",
      "DouseInGasoline",
    ];
    this.meetingMods = {
      "Douse Player": {
        flags: ["group", "speech", "voting"],
      },
      "Light Match": {
        flags: ["group", "speech", "voting"],
      },
    };
  }
};
