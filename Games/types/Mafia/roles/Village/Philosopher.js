const Role = require("../../Role");

module.exports = class Philosopher extends Role {
  constructor(player, data) {
    super("Philosopher", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "ConvertSelfToChosenRole"];
  }
};
