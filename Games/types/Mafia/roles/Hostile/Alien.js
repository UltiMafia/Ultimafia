const Role = require("../../Role");

module.exports = class Alien extends Role {
  constructor(player, data) {
    super("Alien", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "WinAllProbed", "CanProbe"];
  }
};
