const Role = require("../../Role");

module.exports = class WarDemon extends Role {
  constructor(player, data) {
    super("War Demon", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Demonic",
      "NightKiller",
      "MakeTargetsInLove",
      "GiveVisitorsGuns",
      "GiveVisitorsGuns",
      "GiveVisitorsGuns",
    ];
    this.meetingMods = {
      "Solo Kill": {
        actionName: "War Demon All Over them",
        targets: { include: ["alive", "self"] },
      },
    };
  }
};
