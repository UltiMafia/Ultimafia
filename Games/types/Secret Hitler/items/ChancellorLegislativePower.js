const Item = require("../Item");

module.exports = class ChancellorLegislativePower extends Item {
  constructor() {
    super("Chancellor Legislative Power");

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
    player.game.queueAlert(`The Chancellor ${player.name} is enacting a policy...`);
    let targets = player.game.policyPile;
    if (player.game.vetoUnlocked) {
      targets.push("Veto Agenga");
    }

    this.meetings["Discard Policy"].targets = targets;
  }
};
