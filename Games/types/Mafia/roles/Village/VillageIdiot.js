const Role = require("../../Role");

module.exports = class VillageIdiot extends Role {
  constructor(player, data) {
    super("Village Idiot", player, data);
    
    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithVillage",
      "SeeRandomSpeakers",
    ];  
  }
};
