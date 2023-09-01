const Item = require("../Item");

module.exports = class AssentVetoPower extends Item {
  constructor() {
    super("Assent Veto Power");

    this.lifespan = 1;
    this.meetings = {
      "Assent Veto": {
        states: ["Legislative Session"],
        flags: ["voting", "instant"],
        inputType: "boolean",
        action: {
          run: function () {
            if (this.target == "Yes") {
              this.game.vetoAllPolicies();
              return;
            }

            let item = this.game.lastElectedChancellor.holdItem(
              "ChancellorLegislativePower",
              true
            );
            this.game.instantMeeting(item.meetings, [
              this.game.lastElectedChancellor,
            ]);
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.game.queueAlert(
      `The Chancellor has initiated a veto, the President ${player.name} is deciding if the agenda should be vetoed…`
    );
  }
};
