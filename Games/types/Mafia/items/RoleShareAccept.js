const Item = require("../Item");

module.exports = class RoleShareAccept extends Item {
  constructor(proposer, type, accepter) {
    super("RoleShareAccept");

    this.proposer = proposer;
    this.type = type;
    this.cannotBeStolen = true;
    this.cannotBeSnooped = true;
    let meetingName;
    if (this.type == "Role Share") {
      meetingName =
        "Role Share between " + accepter.name + " and " + this.proposer.name;
    } else {
      meetingName =
        "Alignment Share between " +
        accepter.name +
        " and " +
        this.proposer.name;
    }

    this.shareTypes = [];
    if (accepter.hasEffect("CannotRoleShare")) {
      this.shareTypes = ["No"];
    } else if (accepter.hasEffect("MustRoleShare")) {
      this.shareTypes = ["Yes"];
    } else {
      this.shareTypes = ["Yes", "No"];
    }

    this.meetings[meetingName] = {
      states: ["Day"],
      flags: ["voting", "instant"],
      inputType: "custom",
      targets: this.shareTypes,
      action: {
        labels: ["marriage"],
        item: this,
        run: function () {
          if (this.target == "Yes") {
            if (this.item.type == "Role Share") {
              this.actor.role.revealToPlayer(
                this.item.proposer,
                null,
                "investigate"
              );
              this.item.proposer.role.revealToPlayer(
                this.actor,
                null,
                "investigate"
              );
              this.game.events.emit(
                "ShareRole",
                this.actor,
                this.item.proposer,
                false
              );
            } else if (this.item.type == "Alignment Share") {
              var roleActor = this.actor.getAppearance("investigate", true);
              var alignmentActor = this.game.getRoleAlignment(roleActor);
              var roleProposer = this.item.proposer.getAppearance(
                "investigate",
                true
              );
              var alignmentProposer = this.game.getRoleAlignment(roleProposer);

              this.actor.queueAlert(
                `${this.item.proposer.name}'s Alignment is ${alignmentProposer}.`
              );
              this.item.proposer.queueAlert(
                `${this.actor.name}'s Alignment is ${alignmentActor}.`
              );
              this.game.events.emit(
                "ShareRole",
                this.actor,
                this.item.proposer,
                true
              );
            }
          } else {
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
