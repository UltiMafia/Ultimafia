const Item = require("../Item");

module.exports = class Crown extends Item {
  constructor(options) {
    super("Crown");

    this.lifespan = lifespan || 1;

    this.listeners = {
      meeting: function (meeting) {
        if (meeting.members[this.player.id]) {
          meeting.members[this.player.id].voteWeight = Infinity;
        }
      },
    };
  }
};
