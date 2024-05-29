const Role = require("../../Role");

module.exports = class Alien extends Role {
  constructor(player, data) {
    super("Alien", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAllProbed", "CanProbe"];
  }
};
