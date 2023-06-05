const Role = require("../../Role");

module.exports = class VengefulSpirit extends Role {
  constructor(player, data) {
    super("Vengeful Spirit", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "NightKiller", "WinIfTargetDead"];
    this.meetingMods = {
      "Solo Kill": {
        whileDead: true,
        whileAlive: false,
      },
    };
  }
};
