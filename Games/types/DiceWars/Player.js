const Player = require("../../core/Player");

module.exports = class DiceWarsPlayer extends Player {
  constructor(user, game, isBot) {
    super(user, game, isBot);

    console.log(
      "DiceWars Player constructor - Player ID:",
      this.id,
      "Socket exists:",
      !!this.socket
    );

    // Socket handlers for direct tile clicking interface (like Battlesnakes)
    this.socket.on("attack", (data) => {
      try {
        console.log("=== ATTACK SOCKET EVENT ===");
        console.log("Data received:", data);
        const { fromId, toId } = data;
        console.log("From:", fromId, "To:", toId);
        console.log("Current turn player:", this.game.currentTurnPlayerId);
        console.log("This player:", this.id);

        if (this.game.currentTurnPlayerId === this.id) {
          console.log("Executing attack");
          const result = this.game.attack(this.id, fromId, toId);
          console.log("Attack result:", result);
        } else {
          console.log("Not your turn! Ignoring attack.");
        }
      } catch (error) {
        console.error("Error in attack handler:", error);
      }
    });

    this.socket.on("endTurn", (data) => {
      try {
        console.log("=== END TURN SOCKET EVENT ===");
        console.log("Data received:", data);
        console.log("Player:", this.id);
        console.log("Current turn player:", this.game.currentTurnPlayerId);
        console.log("Match:", this.game.currentTurnPlayerId === this.id);

        if (this.game.currentTurnPlayerId === this.id) {
          console.log("Executing endTurn");
          const result = this.game.endTurn(this.id);
          console.log("EndTurn result:", result);
        } else {
          console.log("Not your turn! Ignoring endTurn.");
        }
      } catch (error) {
        console.error("Error in endTurn handler:", error);
        console.error("Stack trace:", error.stack);
      }
    });

    console.log("DiceWars socket listeners registered");
  }
};
