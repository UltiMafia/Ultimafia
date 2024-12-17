const Role = require("../../Role");

module.exports = class Student extends Role {
  constructor(player, data) {
    super("Student", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "BecomeBackUpRole",
    ];
  }
};
