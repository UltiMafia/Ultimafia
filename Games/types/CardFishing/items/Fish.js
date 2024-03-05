const Item = require("../Item");

module.exports = class Fish extends Item {
  constructor() {
    super("Fish");

    this.meetings = {
      "Bait With": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.actor.data.bait = this.target;
          },
        },
      },
      "Fish For": {
        states: ["Turn"],
        flags: ["voting", "instant"],
        inputType: "custom",
        targets: [],
        action: {
          item: this,
          run: function () {
            this.actor.fishCards(this.actor.data.bait,this.target);
            delete this.actor.data.bait;
            this.switchMoves("Fish");
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);

    this.game.queueAlert(
      `${player.name} has chosen to fish for cards…`
    );

    let validCards = player.renderCards(player.getCardsMatched());
    let cardPile = player.renderCards(player.getMatchingCardsMatched());

    this.meetings["Bait With"].targets = validCards;
    this.meetings["Fish For"].targets = cardPile;
  }
};
