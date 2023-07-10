const Role = require("../../Role");

module.exports = class Tree extends Role {
  constructor(player, data) {
    super("Tree", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "ConvertImmune"];
    this.immunity["kill"] = 3;
    this.immunity["lynch"] = 3;
    this.cancelImmunity["ignite"] = Infinity;
    this.meetingMods = {
      Village: {
        canVote: false,
      },
    };
  }
};
