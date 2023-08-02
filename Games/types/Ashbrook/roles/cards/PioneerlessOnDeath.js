const Card = require("../../Card");

module.exports = class PioneerlessOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType) {
        if (player == this.player) this.data.causePioneerless = true;
      },
      state: function (stateInfo) {
        if (this.data.causePioneerless && stateInfo.name.match(/Day/)) {
          this.game.stateEvents["Pioneerless"] = true;
          this.data.causePioneerless = false;
        }
      },
      stateEvents: function (stateEvents) {
        if (stateEvents["Pioneerless"])
          for (let player of this.game.players)
            player.giveEffect("VoteBlind", 1);
      },
    };
  }
};
