const Role = require("../../Role");

module.exports = class Courier extends Role {
  constructor(player, data) {
    super("Courier", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "MessageSender",
    ];
  }
};
