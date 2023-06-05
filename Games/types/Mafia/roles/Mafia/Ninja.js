const Role = require("../../Role");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class Ninja extends Role {
  constructor(player, data) {
    super("Ninja", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia"];
    this.meetingMods = {
      Mafia: {
        actionName: "[hidden] Mafia Kill",
        action: {
          labels: ["kill", "mafia", "hidden", "absolute"],
          priority: PRIORITY_MAFIA_KILL,
          run: function () {
            if (this.dominates()) this.target.kill("basic", this.actor);
          },
        },
      },
    };
  }
};
