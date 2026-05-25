const Item = require("../Item");

module.exports = class JoinVillainMeeting extends Item {
  constructor() {
    super("JoinVillainMeeting");

    this.cannotBeSnooped = true;
    this.lifespan = 1;
    this.cannotBeStolen = true;
    this.meetings = {
      Villain: {
        states: ["Night"],
        flags: ["group", "speech", "anonymous"],
      },
    };
  }
};
