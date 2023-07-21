const Card = require("../../Card");

module.exports = class CannotVoteInMafiaMeeting extends Card {
  constructor(role) {
    super(role);

    this.startEffects = [{ type: "CannotVote", args: [undefined, "Mafia"] }];
  }
};