const Meeting = require("../../core/Meeting");

module.exports = class CardGamesMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }
};
