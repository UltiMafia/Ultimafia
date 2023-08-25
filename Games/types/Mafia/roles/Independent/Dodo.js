const Role = require("../../Role");

module.exports = class Dodo extends Role {
  constructor(player, data) {
    super("Dodo", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfShot", "GunGiver"];
    this.meetingMods = {
      "Give Gun": {
        actionName: "Flock Around",
      },
    };
  }
};
