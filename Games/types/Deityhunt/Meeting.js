const Meeting = require("../../core/Meeting");

module.exports = class DeityhuntMeeting extends Meeting {
  constructor(name, game) {
    super(name, game);
  }

  finish(isVote) {
    super.finish(isVote);

    // for (let member of this.members) {
    //     if (this.votes[member.id])
    //         member.player.recordStat("participation", true);
    //     else
    //         member.player.recordStat("participation", false);
    // }
  }
};
