const Item = require("../Item");

module.exports = class WeddingRing extends Item {
  constructor(options) {
    super("Wedding Ring");

    this.proposer = options?.proposer;

    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;

    let meetingName = "Accept Proposal from " + this.proposer.name;
    this.meetings[meetingName] = {
      meetingName: "Accept Proposal",
      states: ["Day"],
      flags: ["voting", "instant", "Important"],
      inputType: "boolean",
      action: {
        labels: ["marriage"],
        item: this,
        run: function () {
          var isAccepted = "rejected";
          if (this.target == "Yes") {
            isAccepted = "accepted";
            this.item.proposer.giveEffect("Ballroom Partnered", [this.proposer, this.actor]);
            this.actor.giveEffect("Ballroom Partnered", [this.proposer, this.actor]);
            this.item.proposer.removeEffect("Ballroom Unpaired");
            this.actor.removeEffect("Ballroom Unpaired");
          }
          this.game.queueAlert(
            `${this.actor.name} ${isAccepted} the proposal.`
          );
          this.item.drop();
        },
      },
    };
  }
};
