const Role = require("../../Role");

module.exports = class Santa extends Role {
  constructor(player, data) {
    super("Santa", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction", "MeetingFaction",
      "NaughtyOrNice",
      "GivePresents",
    ];
  }
};
