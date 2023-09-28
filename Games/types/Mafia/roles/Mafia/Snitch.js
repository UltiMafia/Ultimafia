const Role = require("../../Role");

module.exports = class Snitch extends Role {
  constructor(player, data) {
    super("Snitch", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "RedirectVisitors"];
    this.meetingMods = {
        Redirect: {
          actionName: "Snitch on",
          targets: { include: ["Mafia"], exclude: ["self"] },
        },
      };
  }
};
