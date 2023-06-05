const Role = require("../../Role");

module.exports = class Ventriloquist extends Role {
  constructor(player, data) {
    super("Ventriloquist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithMafia",
      "MeetingMafia",
      "ControlPuppet",
    ];
    this.meetingMods = {
      Village: {
        speechAbilities: [
          {
            name: "Control Puppet",
            targetsDescription: { include: ["all"], exclude: ["self"] },
            targetType: "player",
            verb: "",
          },
        ],
      },
    };
  }
};
