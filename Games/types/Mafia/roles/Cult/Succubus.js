const Role = require("../../Role");

module.exports = class Succubus extends Role {
  constructor(player, data) {
    super("Succubus", player, data);

    this.alignment = "Cult";
    this.cards = ["VillageCore", "WinWithCult", "MeetingCult", "NightMindRot"];
    this.meetingMods = {
      Rot: {
        targets: { include: ["alive"], exclude: ["Cult"] },
      },
    };
    
  }
};
