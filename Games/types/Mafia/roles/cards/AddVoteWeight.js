const Card = require("../../Card");

module.exports = class AddVoteWeight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      meeting: function (meeting) {
        if (meeting.members[this.player.id]) {
          meeting.members[this.player.id].voteWeight++;
        }
      },
    };
  }
};
