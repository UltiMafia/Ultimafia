const Role = require("../../Role");

module.exports = class Miller extends Role {
  constructor(player, data) {
    super("Miller", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.appearance = {
      self: "Villager",
      reveal: "real",
      condemn: "Mafioso",
      death: "real",
      investigate: "Mafioso",
    };
  }
};
