const Role = require("../../Role");

module.exports = class Ghost extends Role {
  constructor(player, data) {
    super("Ghost", player, data);

    this.alignment = "Ghost";
    this.cards = [
      "TownCore",
      "WinWithGhost",
      "MeetingGhost",
      "GuessWordOnLynch",
    ];
  }
};
