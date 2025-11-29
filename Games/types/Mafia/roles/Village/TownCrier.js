const Role = require("../../Role");

module.exports = class Towncrier extends Role {
  constructor(player, data) {
    super("Town Crier", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BroadcastMessage",
    ];

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
      "Room 1": {
        speechAbilities: [
          {
            name: "Cry",
            targets: ["out"],
            targetType: "out",
            verb: "",
          },
        ],
      },
      "Room 2": {
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
