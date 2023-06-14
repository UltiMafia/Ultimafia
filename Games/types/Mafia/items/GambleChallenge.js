const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class GambleChallenge extends Item {
  constructor(gambler) {
    super("Gamble Challenge");

    this.gambler = gambler;
    this.lifespan = 1;

    const meetingName = `Gamble with ${this.gambler.name}`;
    this.meetings[meetingName] = {
      meetingName: "Gamble",
      states: ["Night"],
      flags: ["voting"],
      inputType: "custom",
      targets: ["Rock", "Paper", "Scissors"],
      action: {
        labels: ["gamble"],
        item: this,
        priority: PRIORITY_KILL_DEFAULT - 1,
        run() {
          const gambleKey = `gamble@${this.item.gambler.name}`;
          this.actor.role.data[gambleKey] = this.target;
          this.item.drop();
        },
      },
    };
  }
};
