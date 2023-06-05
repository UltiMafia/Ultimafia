const Role = require("../../Role");

module.exports = class Medic extends Role {
  constructor(player, data) {
    super("Medic", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "NightSaver"];
    this.meetingMods = {
      Save: {
        targets: { include: ["alive"], exclude: [] },
      },
    };
  }
};
