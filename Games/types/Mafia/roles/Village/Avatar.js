const Role = require("../../Role");

module.exports = class Avatar extends Role {
  constructor(player, data) {
    super("Avatar", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "GainAbilitesIfTargetDies", "WinWithFaction", "MeetingFaction"];
  }
};