const Meeting = require("../../core/Meeting");

module.exports = class SpeedUpMeeting extends Meeting {
  constructor(game) {
    super(game, "Speed Up");

    this.group = true;
    this.voting = true;
    this.noVeg = true;
    // The ballot is a shortcut for the current phase, not an action the game is
    // waiting on, so it must not gate all-ready advancement. Ballots accumulate
    // while enableVote() leaves totalVoters at 0, and Meeting.ready compares the
    // two counts: without this flag one ballot makes the meeting permanently
    // unready, and checkAllMeetingsReady() can no longer end the phase early.
    this.optional = true;
    this.inputType = "button";
    this.targets = ["Speed Up"];
    this.votesInvisible = false;
    this.repeatable = false;
  }

  generateTargets() {
    this.targets = ["Speed Up"];
  }

  getMeetingInfo(player) {
    let info = super.getMeetingInfo(player);
    info.canUnvote = false;
    return info;
  }

  join(player) {
    super.join(player, {
      canVote: false,
    });
  }

  enableVote(player) {
    if (!this.members[player.id]) return;
    this.members[player.id].canVote = true;
    player.sendMeeting(this);
  }

  vote(voter) {
    if (this.votes[voter.id]) return;
    super.vote(voter, "Speed Up");
    this.checkEnoughVoted();
  }

  checkEnoughVoted() {
    if (this.finished) return;

    const numAlive = Object.values(this.game.players).filter(
      (p) => p.alive && !p.left
    ).length;
    const threshold = Math.ceil(numAlive / 2);
    const numVoted = Object.keys(this.votes).length;

    this.game.sendAlert(
      `Speed up: ${numVoted} / ${threshold}`,
      undefined,
      undefined,
      ["info"]
    );

    if (numVoted >= threshold) {
      this.finished = true;
      this.game.sendAlert("Speeding up in 5 seconds!");
      this.game.createTimer("speedUp", 5000, () => this.game.speedUp());
    }
  }

  checkReady() {}

  finish() {}
};
