const Role = require("../../Role");

module.exports = class Matron extends Role {
  constructor(player, data) {
    super("Matron", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "NightMatron"];
  }
};
