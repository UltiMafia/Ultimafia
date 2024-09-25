const Role = require("../../Role");

module.exports = class Prince extends Role {
  constructor(player, data) {
    super("Prince", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "ConquerAlignment", "WinWithCurrentAlignment"];
  }
};
