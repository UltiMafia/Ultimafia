const Role = require("../../Role");

module.exports = class Slayer extends Role {
  constructor(player, data) {
    super("Slayer", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.startItems = [
      {
        type: "Stake",
        args: [{ reveal: true }],
      },
    ];
  }
};
