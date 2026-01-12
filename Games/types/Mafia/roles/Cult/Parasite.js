const Role = require("../../Role");

module.exports = class Parasite extends Role {
  constructor(player, data) {
    super("Parasite", player, data);

    this.alignment = "Cult";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "SelectHostAndDie",
      "CountForMajWhenDead",
    ];

    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Speak As Host",
            targets: ["Speak as Host"],
            targetType: "Speak as Host",
            verb: "",
            whileDead: true,
          },
        ],
      },
      "Village Dusk": {
        speechAbilities: [
          {
            name: "Speak As Host",
            targets: ["Speak as Host"],
            targetType: "Speak as Host",
            verb: "",
            whileDead: true,
          },
        ],
      },
    };
  }
};
