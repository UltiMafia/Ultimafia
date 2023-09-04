const Card = require("../../Card");

module.exports = class VotesAnonOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType) {
        if (player == this.player) this.data.causeLeaderless = true;
      },
      state: function (stateInfo) {
        if (this.data.causeLeaderless && stateInfo.name.match(/Day/)) {
          this.game.stateEvents["VotesAnon"] = true;
          this.data.causeLeaderless = false;
        }
      },
      stateEvents: function (stateEvents) {
        if (stateEvents["VotesAnon"])
          for (let player of this.game.players)
            player.giveEffect("VoteBlind", 1);
      },
    };
  }
};
