const Role = require("../../Role");

module.exports = class Pimp extends Role {
  constructor(player, data) {
    super("Pimp", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "NightDelirium",
    ];
    this.meetingMods = {
      Rot: {
        targets: { include: ["alive"] },
      },
    };
  }
};
