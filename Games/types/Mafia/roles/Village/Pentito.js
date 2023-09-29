const Role = require("../../Role");

module.exports = class Pentito extends Role {
  constructor(player, data) {
    super("Pentito", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "RevealMafiaPlayersToSelf"];

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "Villager",
      death: "Villager",
      investigate: "real",
    };
  }
};
