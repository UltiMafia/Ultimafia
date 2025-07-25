const Item = require("../Item");
const {
  IMPORTANT_MEETINGS,
  ROLE_MEETINGS,
} = require("../const/ImportantMeetings");

module.exports = class ShowdownTime extends Item {
  constructor() {
    super("ShowdownTime");
    this.meetings = {};
  }

  setupMeetings() {
    this.meetings = {
      Move: {
        actionName: "Choose 5 Cards?",
        states: ["Showdown"],
        flags: ["voting", "multi"],
        inputType: "playingCardButtons",
        multiMin: 5,
        multiMax: 5,
        targets: this.PossibleCards,
        action: {
          item: this,
          run: function () {
            this.actor.ShowdownCards = this.target;

            this.item.drop();
          },
        },
      },
    };
  }

  hold(player) {
    super.hold(player);
    this.PossibleCards = [];
    this.PossibleCards.push(...player.CardsInHand);
    this.PossibleCards.push(...player.game.CommunityCards);

    this.setupMeetings();
    /*
    this.meetings.Amount.textOptions.maxLength =
      player.game.lastAmountBid.toString().length + 2;

    if (player.game.gameMasterAnnoyedByHighBidsThisRoundYet) {
      this.meetings.Amount.textOptions.maxNumber =
        parseInt(player.game.lastAmountBid) + 1;
    }
    */
  }
};
