const Role = require("../../Role");

module.exports = class Host extends Role {
  constructor(player, data) {
    super("Host", player, data);

    this.alignment = "Host";
    this.winCount = "Town";
    this.cards = ["TownCore", "AnnounceBothWords", "RevealAllRoles"];
    this.meetingMods = {
      Village: {
        canVote: false,
      },
    };
  }
};
