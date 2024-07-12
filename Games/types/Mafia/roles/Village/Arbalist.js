const Role = require("../../Role");

module.exports = class Arbalist extends Role {
  constructor(player, data) {
    super("Arbalist", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.startItems = [
      {
        type: "Crossbow",
        args: [{ reveal: true }],
      },
    ];
  }
};
