const Role = require("../../Role");

module.exports = class Lobotomist extends Role {
  constructor(player, data) {
    super("Lobotomist", player, data);
    this.alignment = "Mafia";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction",  "Vanillaise"];
    this.meetingMods = {
      Vanillaise: {
        actionName: "Lobotomise",
      },
    };
  }
};
