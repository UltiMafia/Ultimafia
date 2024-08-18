const Role = require("../../Role");

module.exports = class Carrier extends Role {
  constructor(player, data) {
    super("Carrier", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithVillage", "BecomeMindRottedRole"];
  }
};

//If this role is being renamed change it's name in IsTheCarrier.js, BecomeMindRottedRole.js, and Action.js