const Role = require("../../Role");

module.exports = class Chambermaid extends Role {
  constructor(player, data) {
    super("Chambermaid", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "CompareBooleanTrack"];
  }
};
