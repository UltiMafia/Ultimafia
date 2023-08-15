const Role = require("../../Role");

module.exports = class Dodo extends Role {
  constructor(player, data) {
    super("Dodo", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfShot", "Visit"];
    this.meetingMods = {
      Visit: {
        actionName: "Flock Around",
      },
    };  }
};
