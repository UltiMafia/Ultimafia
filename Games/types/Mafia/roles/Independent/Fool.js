const Role = require("../../Role");

module.exports = class Fool extends Role {
  constructor(player, data) {
    super("Fool", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore", "WinIfCondemned", "Visit"];
    this.meetingMods = {
      Visit: {
        actionName: "Fool Around",
      },
    };
    // this.listeners = {
    //   state: function (stateInfo) {
    //     if (stateInfo.name.match(/Night/)) {
    //       this.game.broadcast("NightFool")
    //     }
    //   },
    // };
  }
};
