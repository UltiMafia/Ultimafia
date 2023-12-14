const Role = require("../../Role");

module.exports = class Communist extends Role {
  constructor(player, data) {
    super("Communist", player, data);

    this.alignment = "Hostile";
    this.cards = ["VillageCore", "Vanillaise", "WinIfAllVanilla"];
    this.meetingMods = {
      Vanillaise: {
        actionName: "Seize the Means",
      },
    };
  }
};
