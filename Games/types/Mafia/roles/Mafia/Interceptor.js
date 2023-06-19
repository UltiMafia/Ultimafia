const Role = require("../../Role");

module.exports = class Interceptor extends Role {
  constructor(player, data) {
    super("Interceptor", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "NightTrapper",
    ];
  }
};
