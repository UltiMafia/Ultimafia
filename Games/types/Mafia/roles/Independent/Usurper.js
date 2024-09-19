const Role = require("../../Role");

module.exports = class Usurper extends Role {
  constructor(player, data) {
    super("Usurper", player, data);

    this.alignment = "Independent";
    this.cards = [
      "VillageCore",
      "AnonymizeFactionMeeting",
      "MeetingFaction",
      "WinIfAllMafiaAreMafioso",
      "ConvertMafiaToMafioso",
    ];
  }
};
