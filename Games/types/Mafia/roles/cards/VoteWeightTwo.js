const Card = require("../../Card");

module.exports = class VoteWeightTwo extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      meeting(meeting) {
        if (meeting.members[this.player.id]) {
          meeting.members[this.player.id].voteWeight = 2;
        }
      },
    };
  }
};
