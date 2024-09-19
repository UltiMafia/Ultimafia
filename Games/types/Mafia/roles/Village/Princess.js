const Role = require("../../Role");

module.exports = class Accountant extends Role {
  constructor(player, data) {
    super("Princess", player, data);

    this.alignment = "Village";
    this.cards = ["VillageCore", "WinWithFaction", "MeetingFaction", "IfVotedForceCondemn"];
    this.data.hasBeenVoted = false;
    this.data.playerVoter = 0;
  }
};
