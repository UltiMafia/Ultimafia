const Role = require("../../Role");

module.exports = class Yandere extends Role {
  constructor(player, data) {
    super("Yandere", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAmongLastTwo", "OneWayBond", "NightKiller"];
    this.meetingMods = {
      "Solo Kill": {
        flags: ["voting", "mustAct"],
      },
    };
  }
};
