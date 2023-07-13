const Item = require("../Item");

module.exports = class ChancellorLegislativePower extends Item {
  constructor(vetoRejected) {
    super("Chancellor Legislative Power");

    this.vetoRejected = vetoRejected;
    this.lifespan = 1;
    this.meetings = {
      "Enact Policy": {
        states: ["Legislative Session"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          run: function () {
            if (this.target == "Veto Agenda") {
              // let president assent veto
              let item = this.game.lastElectedPresident.holdItem("AssentVetoPower");
              this.game.instantMeeting(item.meetings, [this.game.lastElectedPresident]);
              return;
            }
            
            this.game.enactPolicyAndDiscardRemaining(this.target);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    let targets = this.game.policyPile.slice();
    this.game.queueAlert(`The Chancellor ${player.name} is enacting a policy…`);
    
    if (this.game.vetoUnlocked && !this.vetoRejected) {
      targets.push("Veto Agenda");
    }

    this.meetings["Enact Policy"].targets = targets;

    if (this.vetoRejected) {
      this.meetings["Enact Policy (No Veto)"] = this.meetings["Enact Policy"];
      delete this.meetings["Enact Policy"];
    }
  }
};
