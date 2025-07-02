const Role = require("../../Role");

module.exports = class Sniper extends Role {
  constructor(player, data) {
    super("Sniper", player, data);

    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: false, modifiers: true }],
      },
    ];
  }
};
