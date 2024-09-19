const Role = require("../../Role");

module.exports = class Trapper extends Role {
  constructor(player, data) {
    super("Trapper", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "NightTrapper"];

    this.listeners = {
      start: [
        function () {
          this.data.mapAlignment = function (a) {
            switch (a) {
              case "Mafia":
                return 0;
              case "Cult":
                return 1;
              case "Independent":
                return 2;
              case "Village":
              default:
                return 3;
            }
          };
        },
      ],
    };
  }
};
