const Role = require("../../Role");

module.exports = class Photographer extends Role {
  constructor(player, data) {
    super("Photographer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "PGRevealRole"];
    this.data = {
      playerToReveal: null,
    };
  }
};
