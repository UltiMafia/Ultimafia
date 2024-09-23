const Role = require("../../Role");

module.exports = class Apprentice extends Role {
  constructor(player, data) {
    super("Apprentice", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "BecomeDeadRole",
    ];
    this.meetingMods = {
      "Become Role": {
        targets: { include: ["Mafia"], exclude: ["alive", "self"] },
      },
    };
  }
};
