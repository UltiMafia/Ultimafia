const Role = require("../../Role");

module.exports = class Doppelganger extends Role {
  constructor(player, data) {
    super("Doppelganger", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "CopyRole"];
    this.meetingMods = {
      "Copy Role": {
        flags: ["voting", "instant", "mustAct"],
      },
    };
  }
};
