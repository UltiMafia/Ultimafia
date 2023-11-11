const Card = require("../../Card");

module.exports = class CannotVoteInCultMeeting extends Card {
  constructor(role) {
    super(role);

    this.startEffects = [{ type: "CannotVote", args: [undefined, "Cult"] }];
  }
};
