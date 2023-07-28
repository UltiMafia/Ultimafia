const Role = require("../../Role");

module.exports = class Messenger extends Role {
  constructor(player, data) {
    super("Messenger", player, data);
    this.alignment = "Villager";
    this.cards = ["VillageCore", "WinWithGood", "MessageSender"];
  }
};
