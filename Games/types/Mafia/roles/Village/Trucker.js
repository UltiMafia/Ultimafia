const Role = require("../../Role");

module.exports = class Trucker extends Role {
  constructor(player, data) {
    super("Trucker", player, data);
    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "StartingItemGiver"];
  }
  init(modifiers, itemStatus){
    super.init(modifiers, "NoStartingItems");
  }
};
