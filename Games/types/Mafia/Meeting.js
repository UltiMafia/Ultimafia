const Meeting = require("../../core/Meeting");

module.exports = class MafiaMeeting extends Meeting {
  constructor(name, game) {
    super(name, game);
  }

  join(player, options) {
    super.join(player, options);
    if (
      this.game &&
      typeof this.game.isConversionNightPhase == "function" &&
      this.game.isConversionNightPhase(this.game.getStateName())
    ) {
      // No choice, or a choice that arrives after the clock, is a skip.
      // It is not a veg and it is not a kick.
      this.noVeg = true;
      this.mustAct = false;
    }
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
      this.name == "Banquet" ||
      this.name == "Templar Meeting" ||
      this.name == "Cult"
    ) {
      this.targets = ["Yes"];
      return;
    }
  }
};
