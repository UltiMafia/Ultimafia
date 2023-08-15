const Role = require("../../Role");

module.exports = class Popinjay extends Role {
  constructor(player, data) {
    super("Popinjay", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfShot", "Visit"];
    this.meetingMods = {
      Visit: {
        actionName: "Flock Around",
      },
    };  }
};
