const Card = require("../../Card");

module.exports = class EclipseOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death(player, killer, killType) {
        if (player == this.player) this.data.causeEclipse = true;
      },
      state(stateInfo) {
        if (this.data.causeEclipse && stateInfo.name.match(/Day/)) {
          this.game.stateEvents.Eclipse = true;
          this.data.causeEclipse = false;
        }
      },
      stateEvents(stateEvents) {
        if (stateEvents.Eclipse)
          for (const player of this.game.players) player.giveEffect("Blind", 1);
      },
    };
  }
};
