const Card = require("../../Card");

module.exports = class BlockIfVisited extends Card {

  constructor(role) {
    super(role);

    this.meetingMods = {
        "*": {
          run: function () {
          let visitors = this.getVisitors();
          if (visitors.length > 0) {
            return;
          }
        },
      },
    };
  }
};
