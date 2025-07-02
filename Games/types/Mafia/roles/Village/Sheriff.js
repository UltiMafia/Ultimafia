const Role = require("../../Role");

module.exports = class Sheriff extends Role {
  constructor(player, data) {
    super("Sheriff", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: true, modifiers: true }]
      },
    ];
  }
};
