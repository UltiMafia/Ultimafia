const Player = require("../../core/Player");

module.exports = class BattleshipPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);
  }

  socketListeners() {
    super.socketListeners();

    this.socket.on("battleshipPlace", (data) => {
      try {
        if (!data || !Array.isArray(data.ships)) return;
        const error = this.game.placeFleet(this, data.ships);
        if (error) this.sendAlert(error);
      } catch (e) {
        this.handleError(e);
      }
    });

    this.socket.on("battleshipFire", (data) => {
      try {
        if (!data) return;
        const row = Number(data.row);
        const col = Number(data.col);
        if (Number.isNaN(row) || Number.isNaN(col)) return;
        const error = this.game.fire(this, row, col);
        if (error) this.sendAlert(error);
      } catch (e) {
        this.handleError(e);
      }
    });
  }
};
