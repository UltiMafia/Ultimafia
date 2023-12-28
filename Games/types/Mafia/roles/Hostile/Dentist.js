const Role = require("../../Role");

module.exports = class Dentist extends Role {
  constructor(player, data) {
    super("Serial Killer", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAmongLastTwo", "NightGasser"];
    this.meetingMods = {
      "Solo Kill": {
        flags: ["voting", "mustAct"],
      },
    };
  }
};
