const Card = require("../../Card");

module.exports = class LeaderlessOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death(player, killer, killType) {
        if (player == this.player) this.data.causeLeaderless = true;
      },
      state(stateInfo) {
        if (this.data.causeLeaderless && stateInfo.name.match(/Day/)) {
          this.game.stateEvents.Leaderless = true;
          this.data.causeLeaderless = false;
        }
      },
      stateEvents(stateEvents) {
        if (stateEvents.Leaderless)
          for (const player of this.game.players)
            player.giveEffect("VoteBlind", 1);
      },
    };
  }
};
