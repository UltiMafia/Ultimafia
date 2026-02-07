const Role = require("../../Role");

module.exports = class Carpenter extends Role {
  constructor(player, data) {
    super("Carpenter", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "StartingItemGiver"];
  }
  init(modifiers, itemStatus){
    super.init(modifiers, "NoStartingItems");
  }
};
