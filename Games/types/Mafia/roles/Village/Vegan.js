const Role = require("../../Role");

module.exports = class Vegan extends Role {
  constructor(player, data) {
    super("Vegan", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "ConfirmSelf"];
  }
};
