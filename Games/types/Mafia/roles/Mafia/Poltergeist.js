const Role = require("../../Role");

module.exports = class Poltergeist extends Role {
  constructor(player, data) {
    super("Poltergeist", player, data);
    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "NightRoleBlocker",
    ];
    this.meetingMods = {
      Block: {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
