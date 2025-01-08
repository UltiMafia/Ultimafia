const Item = require("../Item");

module.exports = class ProposalOffer extends Item {
  constructor(proposer) {
    super("Proposal Offer");

    this.proposer = proposer;

    let meetingName = "Accept Proposal from " + this.proposer.name;
    this.meetings[meetingName] = {
      meetingName: "Accept Proposal",
      states: ["Day"],
      flags: ["voting", "instant"],
      inputType: "boolean",
      action: {
        labels: ["marriage"],
        item: this,
        run: function () {
          var isAccepted = "rejected";
          if (this.target == "Yes") {
            isAccepted = "accepted";

            if (!this.item.proposer.alive) {
              this.actor.role.revealToAll();
              this.game.queueAlert(
                `${this.actor.name} weeps at the dead suitress.`
              );
              return;
            }
            this.game.queueAlert(
            `${this.actor.name} ${isAccepted} the proposal.`
          );
            this.game.addDice(this.actor);
            this.game.addDice(this.item.proposer);
            
          }
          else{
            this.game.queueAlert(
            `${this.actor.name} ${isAccepted} the proposal.`
          );
           this.game.removeDice(this.item.proposer, 1, true);
          }

          this.item.drop();
        },
      },
    };
  }
};
