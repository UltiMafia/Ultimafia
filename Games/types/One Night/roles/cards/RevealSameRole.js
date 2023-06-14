const Card = require("../../Card");

module.exports = class RevealSameRole extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: -100,
        run() {
          if (this.game.getStateName() != "Night") return;

          for (const player of this.game.players)
            if (
              player != this.actor &&
              player.role.name == this.actor.role.name
            )
              this.actor.queueAlert(`${player.name} is a ${player.role.name}`);
        },
      },
    ];
  }
};
