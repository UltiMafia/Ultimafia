const Role = require("../../Role");

module.exports = class Succubus extends Role {
  constructor(player, data) {
    super("Succubus", player, data);

    this.alignment = "Cult";
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
