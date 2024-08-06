const Role = require("../../Role");

module.exports = class Flowergirl extends Role {
  constructor(player, data) {
    super("Flowergirl", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CountEvilVotes"];
  }
};
