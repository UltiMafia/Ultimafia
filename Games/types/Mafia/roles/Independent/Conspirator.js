const Role = require("../../Role");

module.exports = class Conspirator extends Role {
  constructor(player, data) {
    super("Conspirator", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "BecomeBackUpRole",
    ];
  }
};
