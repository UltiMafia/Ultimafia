const Item = require("../Item");

module.exports = class ChancellorLegislativePower extends Item {
  constructor() {
    super("Chancellor Legislative Power");

    this.lifespan = 1;
    this.meetings = {
      "Enact Policy": {
        states: ["Legislative Session"],
        flags: ["voting"],
        inputType: "custom",
        targets: [],
        action: {
          run: function () {
            if (this.target == "Veto Agenda") {
              // let president assent veto
              let item = this.electedPresident.holdItem("AssentVetoPower");
              this.game.instantMeeting(item.meetings, [this.electedPresident]);
            }
            
            this.game.enactPolicyAndDiscardRemaining(this.target);
          },
        },
      },
    };
  }

  hold(player) {
    let targets = player.game.policyPile;
    if (player.game.vetoUnlocked) {
      targets.push("Veto Agenda");
      player.game.queueAlert(`The Chancellor ${player.name} is deciding if the agenda should be vetoed…`);
    } else {
      player.game.queueAlert(`The Chancellor ${player.name} is enacting a policy…`);
    }

    this.meetings["Discard Policy"].targets = targets;
  }
};
