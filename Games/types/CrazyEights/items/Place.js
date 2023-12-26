const Item = require("../Item");

module.exports = class Place extends Item {
  constructor() {
    super("Place");
    this.meetings = {
      "Place Card": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            let proposedCard = this.target;
            let proposedValue = proposedCard[1];
            let wildCards = this.game.wildCards;

            this.actor.addScore(proposedValue);

            if (wildCards.include(proposedValue)) {
              if (proposedValue === "8") {
                this.actor.switchMoves("Place", "Declare");
                this.actor.removeCardFromHand(proposedCard);
              } else if (proposedValue === "Q") {
                this.passMoveToPlayerAfterNext("Place");
                this.actor.placeCard(proposedCard);
              } else if (proposedValue === "A") {
                this.flipBoolean(this.game.reverse);
                this.actor.placeCard(proposedCard);
                this.passMoveToNextPlayer("Place");
              } else if (proposedValue === "2") {
                this.actor.placeCard(proposedCard);
                this.passMoveToNextPlayerDraw2("Place");
              }
            } else {
              this.actor.placeCard(proposedCard);
              this.passMoveToNextPlayer("Place");
            }
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} is placing a card…`
    );
    
    let allowedCards = player.getAllowedCards();
    this.meetings["Place Card"].targets = allowedCards.slice();
  }
};