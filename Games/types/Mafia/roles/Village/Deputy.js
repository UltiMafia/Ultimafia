const Role = require("../../Role");

module.exports = class Deputy extends Role {
  constructor(player, data) {
    super("Deputy", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: false }],
      },
    ];
  }
};
