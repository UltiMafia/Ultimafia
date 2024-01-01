const Card = require("../../Card");

module.exports = class VotesAnonymousOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType) {
        if (player == this.player) this.data.causeVoteAnonymous = true;
      },
      state: function (stateInfo) {
        if (this.data.causeVoteAnonymous && stateInfo.name.match(/Day/)) {
          this.game.stateEvents["VotesAnonymous"] = true;
          this.data.causeVoteAnonymous = false;
        }
      },
      stateEvents: function (stateEvents) {
        if (stateEvents["VotesAnonymous"])
          for (let player of this.game.players)
            player.giveEffect("VoteBlind", 1);
      },
    };
  }
};
