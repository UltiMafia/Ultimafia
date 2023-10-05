const Meeting = require("../../core/Meeting");

module.exports = class SecretDictatorMeeting extends Meeting {
  constructor(game, name) {
    super(game, name);
  }

  get hasPlurality() {
    return true;
  }
};
