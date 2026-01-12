const Role = require("../../Role");

module.exports = class Spy extends Role {
  constructor(player, data) {
    super("Spy", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "ContactByRole",
    ];
    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "role",
            verb: "",
          },
        ],
      },
      "Village Dusk": {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "role",
            verb: "",
          },
        ],
      },
      "Room 1": {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "role",
            verb: "",
          },
        ],
      },
      "Room 2": {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "role",
            verb: "",
          },
        ],
      },
    };
  }
};
