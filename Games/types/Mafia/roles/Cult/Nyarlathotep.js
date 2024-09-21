const Role = require("../../Role");

module.exports = class Nyarlathotep extends Role {
  constructor(player, data) {
    super("Nyarlathotep", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
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
    this.data.NyarlathotepWin = false;
  }
};
