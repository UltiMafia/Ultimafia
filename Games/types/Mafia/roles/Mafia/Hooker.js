const Role = require("../../Role");

module.exports = class Hooker extends Role {
  constructor(player, data) {
    super("Hooker", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      
      "NightRoleBlocker",
    ];
    this.meetingMods = {
      Block: {
        targets: { include: ["alive"], exclude: ["Mafia"] },
      },
    };
  }
};
