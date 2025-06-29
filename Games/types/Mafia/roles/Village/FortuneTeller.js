const Role = require("../../Role");

module.exports = class FortuneTeller extends Role {
  constructor(player, data) {
    super("Fortune Teller", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "LearnIfEvilWasSelected",
    ];
  }
};
