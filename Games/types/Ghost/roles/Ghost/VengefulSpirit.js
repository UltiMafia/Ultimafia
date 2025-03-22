const Role = require("../../Role");

module.exports = class VengefulSpirit extends Role {
  constructor(player, data) {
    super("Vengeful Spirit", player, data);

    this.alignment = "Ghost";
    this.cards = [
      "TownCore",
      "WinWithGhost",
      "MeetingGhost",
      "GuessWordOnCondemn",
      "GetHintWhenTargetDies",
    ];
  }
};
