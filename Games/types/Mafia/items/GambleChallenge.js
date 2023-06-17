const Item = require("../Item");
const { PRIORITY_KILL_DEFAULT } = require("../const/Priority");

module.exports = class GambleChallenge extends Item {
  constructor(gambler, gambleInitiated) {
    super("Gamble Challenge");

    this.gambler = gambler;
    this.lifespan = 1;
    
    let initiated = "";
    if (gambleInitiated == true) {
      initiated = " (Initiated)"
    } else if (gambleInitiated == false) {
      initiated = " (Received)"
    }
    
    let meetingName = "Gamble with " + this.gambler.name;
    let actionName = "Gamble " + initiated;
    this.meetings[meetingName] = {
      meetingName: "Gamble",
      actionName: actionName,
      states: ["Night"],
      flags: ["voting"],
      inputType: "custom",
      targets: ["Rock", "Paper", "Scissors"],
      action: {
        labels: ["gamble"],
        item: this,
        priority: PRIORITY_KILL_DEFAULT - 1,
        run: function () {
          let gambleKey = `gamble@${this.item.gambler.name}`;
          this.actor.role.data[gambleKey] = this.target;
          this.item.drop();
        },
      },
    };
  }
};
