const Role = require("../../Role");

module.exports = class SunkHost extends Role {
  constructor(player, data) {
    super("SunkHost", player, data);

    this.alignment = "Host";
    this.winCount = "Town";
    this.cards = ["TownCore", "AnnounceBothWords"];
    this.meetingMods = {
      Village: {
        canVote: false,
      },
    };
  }
};
