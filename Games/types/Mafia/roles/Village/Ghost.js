const Role = require("../../Role");

module.exports = class Ghost extends Role {
  constructor(player, data) {
    super("Ghost", player, data);
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "NightRoleBlocker",
      "Humble",
    ];
    this.meetingMods = {
      Block: {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
