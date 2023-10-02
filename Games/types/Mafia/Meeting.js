const Meeting = require("../../core/Meeting");

module.exports = class MafiaMeeting extends Meeting {
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

  generateTargets() {
    super.generateTargets();

    // overwrite the dawn + daystart logic
    if (
      this.name == "Party!" ||
      this.name == "Masquerade!" ||
      this.name == "Banquet" ||
      this.name == "Templar Meeting" ||
      this.name == "Cult"
    ) {
      this.targets = ["Yes"];
      return;
    }
  }
};
