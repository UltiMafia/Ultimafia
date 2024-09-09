const Role = require("../../Role");

module.exports = class Hierophant extends Role {
  constructor(player, data) {
    super("Hierophant", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BecomeFakeCultRole"];
  }
};

//If this role is being renamed change it's name in IsTheHierophant.js, BecomeFakeCultRole.js, Action.js, WinWithCult.js, WinWithVillage.js, Endangered.js, KillCultistsOnDeath.js, and MeetingCult.js
