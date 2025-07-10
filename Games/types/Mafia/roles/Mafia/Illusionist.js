const Role = require("../../Role");

module.exports = class Illusionist extends Role {
  constructor(player, data) {
    super("Illusionist", player, data);

    this.alignment = "Mafia";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",

      "ShooterFramer",
    ];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: true }],
      },
    ];
  }
};
