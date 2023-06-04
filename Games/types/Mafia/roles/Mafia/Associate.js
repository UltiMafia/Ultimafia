const Role = require("../../Role");

module.exports = class Associate extends Role {
  constructor(player, data) {
    super("Associate", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "AssoGunGiver",
    ];
  }
};
