const Card = require("../../Card");

module.exports = class WinWithBlue extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: 0,
      check(winners) {
        let presidentRoom;
        let bomberRoom;

        for (const player of this.game.room1) {
          if (player.role.name == "President") presidentRoom = 1;
          else if (player.role.name == "Bomber") bomberRoom = 1;
        }

        for (const player of this.game.room2) {
          if (player.role.name == "President") presidentRoom = 2;
          else if (player.role.name == "Bomber") bomberRoom = 2;
        }

        if (presidentRoom != bomberRoom) winners.addPlayer(this.player, "Blue");
      },
    };
  }
};
