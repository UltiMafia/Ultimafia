const Role = require("../../Role");

module.exports = class Snitch extends Role {
  constructor(player, data) {
    super("Snitch", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RevealEvilPlayersToSelf"];

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "Villager",
      investigate: "real",
    };
  }
};
