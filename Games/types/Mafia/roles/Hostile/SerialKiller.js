const Role = require("../../Role");

module.exports = class SerialKiller extends Role {
  constructor(player, data) {
    super("Serial Killer", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAmongLastTwo", "NightKiller"];
    this.meetingMods = {
      "Solo Kill": {
        flags: ["voting", "mustAct"],
      },
    };
  }
};
