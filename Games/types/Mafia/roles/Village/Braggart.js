const Role = require("../../Role");

module.exports = class Braggart extends Role {
  constructor(player, data) {
    super("Braggart", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeDeliriousRole",
    ];
  }
};

//If this role is being renamed change its name in IsTheBraggart.js, BecomeDeliriousRole.js, and Action.js
