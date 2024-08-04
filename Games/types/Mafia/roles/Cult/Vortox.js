const Role = require("../../Role");

module.exports = class Vortox extends Role {
  constructor(player, data) {
    super("Vortox", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithCult",
      "MeetingCult",
      "Endangered",
      "MakeAllVillageInfoFalse",
      "CultWinsIfNoCondemn",
      "NightKiller",
    ];
    this.meetingMods = {
      "Solo Kill": {
        targets: { include: ["alive"], exclude: ["Cult"] },
      },
    };
  }
};
