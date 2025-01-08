const Item = require("../Item");

module.exports = class Propose extends Item {
  constructor() {
    super("Propose");

    this.selectedPlayers = [];
    this.meetings = {
      Propose: {
        actionName: "Propose to Player",
        states: ["Guess Dice"],
        flags: ["voting", "instant", "noVeg"],
        action: {
          item: this,
          run: function () {
            if(this.item.selectedPlayers.includes(this.target)){
              this.actor.queueAlert(
              `You already proposed to ${this.target.name}, Choose another player!`
            );
              return;
            }

            this.game.queueAlert(
              `:gun: ${this.actor.name} proposes to ${this.target.name}!`
            );
            this.target.queueAlert(
              `${this.actor.name} has Proposed to You if you Accept, You and ${this.actor.name} gain a dice. If you Reject ${this.actor.name} Loses a Dice!`
            );
            this.target.holdItem("ProposalOffer", this.actor);
          },
        },
      },
    };
  }
};
