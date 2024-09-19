const Role = require("../../Role");

module.exports = class Agent extends Role {
  constructor(player, data) {
    super("Agent", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "ContactByRole"];
    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Contact",
            targetsDescription: { include: ["all"], exclude: ["Village"] },
            targetType: "role",
            verb: "",
          },
        ],
      },
    };
  }
};
