const Item = require("../Item");

module.exports = class BallPair extends Item {
  constructor(options) {
    super("Ball Pair");

    this.pairedWith = options?.pairedWith;
    this.pairProposer = options?.pairProposer;
    this.pairAcceptor = options?.pairAcceptor;

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    let meetingName = "Dance Pair Gathering of " + this.pairProposer.name + "and " + this.pairAcceptor.name;
    this.meetings[meetingName] = {
      meetingName: "Dance Pair Gathering",
      actionName: "End Dance Pair Gathering?",
      states: ["Night"],
      flags: ["group", "speech", "voting", "mustAct", "noVeg"],
      inputType: "boolean",
    };

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player == this.pairedWith) {
          this.holder.kill("ballAbandoned", this.pairedWith, instant);
        }
      },
    };
  }
};