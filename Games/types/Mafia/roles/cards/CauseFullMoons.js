const Card = require("../../Card");

module.exports = class CauseFullMoons extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state(stateInfo) {
        if (!this.player.alive) return;

        if (stateInfo.name.match(/Night/) && stateInfo.dayCount % 2 == 1)
          this.game.stateEvents["Full Moon"] = true;
      },
    };
  }
};
