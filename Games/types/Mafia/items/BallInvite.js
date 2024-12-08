const Item = require("../Item");

module.exports = class BallInvite extends Item {
  constructor(options) {
    super("Ball Invite");

    this.proposer = options?.proposer;
    this.proposal = options?.proposal;

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    let meetingName = "Dance Pair Proposal from " + this.proposer.name;
    this.meetings[meetingName] = {
      meetingName: "Dance Pair Acception",
      actionName: "Accept Pair Proposal?",
      states: ["Day"],
      flags: ["voting", "instant"],
      inputType: "boolean",
      action: {
        labels: ["ballroom"],
        item: this,
        run: function () {
          var isAccepted = "rejected";
          if (this.target == "Yes") {
            isAccepted = "accepted";

            this.item.proposer.role.pairFormed = true;

            let pairProposer = this.item.proposer;
            let pairAcceptor = this.actor;

            pairProposer.holdItem("BallPair", { pairedWith: pairAcceptor, pairProposer: pairProposer, pairAcceptor: pairAcceptor });
            pairAcceptor.holdItem("BallPair", { pairedWith: pairProposer, pairProposer: pairProposer, pairAcceptor: pairAcceptor });
          }

          this.game.queueAlert(
            `${this.actor.name} ${isAccepted} the proposal.`
          );

          this.proposal.drop();
          this.item.drop();
        },
      },
    };
  }
};
