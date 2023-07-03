const Role = require("../../Role");

module.exports = class SunkGhost extends Role {
  constructor(player, data) {
    super("SunkGhost", player, data);

    this.alignment = "Ghost";
    this.cards = [
      "TownCore",
      "WinWithGhost",
      "MeetingGhost",
      "GuessWordOnLynch",
    ];
  }
};
