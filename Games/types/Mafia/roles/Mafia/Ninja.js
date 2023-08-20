const Role = require("../../Role");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class Ninja extends Role {
  constructor(player, data) {
    super("Ninja", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "MakeKillHidden"];
  }
};
