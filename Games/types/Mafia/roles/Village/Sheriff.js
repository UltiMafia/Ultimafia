const Role = require("../../Role");

module.exports = class Sheriff extends Role {
  constructor(player, data) {
    super("Sheriff", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: true }],
      },
    ];
  }
};
