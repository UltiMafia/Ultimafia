const Item = require("../Item");

module.exports = class PresidentialLegislativePower extends Item {
  constructor() {
    super("Presidential Legislative Power");

    this.lifespan = 1;
    this.meetings = {
      "Discard Policy": {
        states: ["Legislative Session"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.game.discardPolicy(this.target);
            this.item.drop();

            // let chancellor enact policy
            let item = this.game.lastElectedChancellor.holdItem("ChancellorLegislativePower");
            this.game.instantMeeting(item.meetings, [this.game.lastElectedChancellor]);
          },
        },
      },
    };
  }

  hold(player) {    
    super.hold(player);

    this.game.queueAlert(`The President ${player.name} is discarding a policy…`);
    this.meetings["Discard Policy"].targets = player.game.policyPile.slice();
  }
};
