const Role = require("../../Role");

module.exports = class Sphinx extends Role {
  constructor(player, data) {
    super("Sphinx", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "WinAmongLastTwo",
      "SphinxNumberSequence",
      "SphinxVisitor",
    ];
  }
};
