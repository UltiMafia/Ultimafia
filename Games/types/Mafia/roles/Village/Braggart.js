const Role = require("../../Role");

module.exports = class Braggart extends Role {
  constructor(player, data) {
    super("Braggart", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BecomeMindRottedRole"];
  }
};

//If this role is being renamed change it's name in IsTheBraggart.js, BecomeMindRottedRole.js, and Action.js
