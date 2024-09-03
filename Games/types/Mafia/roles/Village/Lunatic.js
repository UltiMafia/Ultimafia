const Role = require("../../Role");

module.exports = class Lunatic extends Role {
  constructor(player, data) {
    super("Lunatic", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BecomeFakeCultRole"];
  }
};

//If this role is being renamed change it's name in IsTheLunatic.js, BecomeFakeCultRole.js, Action.js, WinWithCult.js, WinWithVillage.js, Endangered.js, KillCultistsOnDeath.js, and MeetingCult.js
