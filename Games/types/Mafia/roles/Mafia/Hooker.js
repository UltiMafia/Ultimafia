const Role = require("../../Role");

module.exports = class Hooker extends Role {
  constructor(player, data) {
    super("Hooker", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "NightRoleBlocker",
    ];
    this.meetingMods = {
      Block: {
        targets: { include: ["alive"], exclude: ["Mafia"] },
      },
    };
  }
};
