const Role = require("../../Role");

module.exports = class Puppetmaster extends Role {
  constructor(player, data) {
    super("Puppetmaster", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "SilencePuppet"];
    
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
