const Role = require("../../Role");

module.exports = class Judge extends Role {
  constructor(player, data) {
    super("Judge", player, data);
    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinAmongLastTwo",
      "CourtSession",
      "BroadcastMessage",
      "AddDusk",
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
      Court: {
        speechAbilities: [
          {
            name: "Cry",
            targets: ["out"],
            targetType: "out",
            verb: "",
          },
        ],
        voteWeight: 3,
      },
    };
  }
};
