const Role = require("../../Role");

module.exports = class Televangelist extends Role {
  constructor(player, data) {
    super("Televangelist", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeFakeCultRole",
    ];
  }
};

//If this role is being renamed change it's name in IsTheTelevangelist.js, BecomeFakeCultRole.js, Action.js, WinWithCult.js, WinWithVillage.js, Endangered.js, KillCultistsOnDeath.js, and MeetingCult.js
