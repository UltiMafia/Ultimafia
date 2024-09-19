const Role = require("../../Role");

module.exports = class Housekeeper extends Role {
  constructor(player, data) {
    super("Housekeeper", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "CompareBooleanTrack"];
  }
};
