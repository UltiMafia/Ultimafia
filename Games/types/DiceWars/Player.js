const Player = require("../../core/Player");
const deathMessages = require("./templates/death");

module.exports = class DiceWarsPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    this.deathMessages = deathMessages;
  }

  // Override socketListeners so DiceWars handlers are re-registered
  // whenever the socket changes (e.g. on reconnect via setUser)
  socketListeners() {
    super.socketListeners();

    this.socket.on("attack", (data) => {
      try {
        const { fromId, toId } = data;

        if (this.game.currentTurnPlayerId === this.id) {
          this.game.attack(this.id, fromId, toId);
        }
      } catch (error) {
        console.error("Error in attack handler:", error);
      }
    });

    this.socket.on("endTurn", (data) => {
      try {
        if (this.game.currentTurnPlayerId === this.id) {
          this.game.endTurn(this.id);
        }
      } catch (error) {
        console.error("Error in endTurn handler:", error);
      }
    });
  }
};
