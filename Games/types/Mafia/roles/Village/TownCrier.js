const Role = require("../../Role");

module.exports = class Towncrier extends Role {
  constructor(player, data) {
    super("Town Crier", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BroadcastMessage"];
    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Cry",
            targets: ["out"],
            targetType: "out",
            verb: "",
          },
        ],
      },
    };
  }
};
