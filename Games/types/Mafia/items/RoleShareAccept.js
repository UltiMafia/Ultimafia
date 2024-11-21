const Item = require("../Item");

module.exports = class WeddingRing extends Item {
  constructor(proposer, type) {
    super("Wedding Ring");

    this.proposer = proposer;
    this.type = type;

    let meetingName = "Accept Role Share from " + this.proposer.name;
    this.meetings[meetingName] = {
      states: ["Day"],
      flags: ["voting", "instant"],
      inputType: "boolean",
      action: {
        labels: ["marriage"],
        item: this,
        run: function () {
          if (this.target == "Yes") {
            if(this.item.type == "Role Share"){
            this.actor.role.revealToPlayer(this.item.proposer);
            this.item.proposer.role.revealToPlayer(this.actor);
              this.game.events.emit("ShareRole", this.actor, this.item.proposer, false);
            }
            else if(this.item.type == "Alignment Share"){

            var roleActor = this.actor.getAppearance("reveal", true);
            var alignmentActor = this.game.getRoleAlignment(roleActor);
            var roleProposer = this.actor.getAppearance("reveal", true);
            var alignmentProposer = this.game.getRoleAlignment(roleProposer);

              
            this.actor.queueAlert(
            `${this.item.proposer.name}'s Alignment is ${alignmentProposer}.`
          );
          this.item.proposer.queueAlert(
            `${this.actor.name}'s Alignment is ${alignmentActor}.`
          );
            this.game.events.emit("ShareRole", this.actor, this.item.proposer, true);
            }
            
          }
          else{
            this.item.proposer.queueAlert(
            `${this.actor.name} has declined to Share.`
          );
          }
          this.item.drop();
        },
      },
    };
  }
};
