const Role = require("../../Role");

module.exports = class Drunk extends Role {
  constructor(player, data) {
    super("Drunk", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightRoleBlocker", "EasterEggDrunkDrive"];
    this.meetingMods = {
      Block: {
        actionName: "Barhop With",
      },
    };
  }
};
