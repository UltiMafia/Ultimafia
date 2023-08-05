const Role = require("../../Role");

module.exports = class Sniper extends Role {
  constructor(player, data) {
    super("Sniper", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: false }],
      },
    ];
  }
};
