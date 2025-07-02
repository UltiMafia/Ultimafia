const Role = require("../../Role");

module.exports = class Deputy extends Role {
  constructor(player, data) {
    super("Deputy", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction"];
    this.startItems = [
      {
        type: "Gun",
        args: [{ reveal: false, modifiers: true }],
      },
    ];
  }
};
