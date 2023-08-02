const Role = require("../../Role");
const Random = require("../../../../../lib/Random");

module.exports = class Hermit extends Role {
  constructor(player, data) {
    super("Hermit", player, data);

    this.alignment = Random.randArrayVal(["Outcast", "Leader"]);
    this.cards = ["VillageCore", "WinWithGood", "PossiblyRegisterAsEvil"];
  }
};
