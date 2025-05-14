const Role = require("../../Role");

module.exports = class BountyHunter extends Role {
  constructor(player, data) {
    super("Bounty Hunter", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "AddEvilVillage",
      "HuntEvilPlayers"
    ];
  }
};
