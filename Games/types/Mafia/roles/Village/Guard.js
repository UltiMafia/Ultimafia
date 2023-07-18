const Role = require("../../Role");

module.exports = class Guard extends Role {
  constructor(player, data) {
    super("Guard", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinsWithVillage",
      "Rolestopper",
    ];
  }
};
