const Role = require("../../Role");

module.exports = class Messenger extends Role {
  constructor(player, data) {
    super("Messenger", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "MessageSender"];
  }
};
