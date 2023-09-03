const Role = require("../../Role");

module.exports = class Usurper extends Role {
  constructor(player, data) {
    super("Usurper", player, data);

    this.alignment = "Hostile";
    this.cards = [
      "VillageCore",
      "MeetingMafia",
      "WinIfAllMafiaAreMafioso",
      "ConvertMafiaToMafioso",
      "AnonymizeMafia",
    ];
  }
};
