const Role = require("../../Role");

module.exports = class Supervillain extends Role {
  constructor(player, data) {
    super("Supervillain", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "WinAloneIndependent"];
  }
};
