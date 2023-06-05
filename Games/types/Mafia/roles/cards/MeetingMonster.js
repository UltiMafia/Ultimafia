const Card = require("../../Card");

module.exports = class MeetingMonster extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      Monsters: {
        states: ["Night"],
        flags: ["group", "speech"],
        canVote: false,
      },
    };
  }
};
