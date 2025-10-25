const Card = require("../../Card");

module.exports = class AttackTerritory extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Attack Territory": {
        actionName: "Attack",
        states: ["Play"],
        flags: ["voting"],
        inputType: "custom",
        targets: function() {
          // Generate list of valid attack combinations
          const validAttacks = [];
          const playerTerritories = this.game.territories.filter(
            t => t.playerId === this.player.id && t.dice >= 2
          );

          for (let fromTerritory of playerTerritories) {
            for (let neighborId of fromTerritory.neighbors) {
              const toTerritory = this.game.territories.find(t => t.id === neighborId);
              if (toTerritory && toTerritory.playerId !== this.player.id && toTerritory.playerId !== null) {
                // Format: "Territory X (3 dice) -> Territory Y (2 dice)"
                const fromPlayer = this.game.players.find(p => p.id === fromTerritory.playerId);
                const toPlayer = this.game.players.find(p => p.id === toTerritory.playerId);
                const attackLabel = `Territory ${fromTerritory.id} (${fromTerritory.dice}🎲) → Territory ${toTerritory.id} (${toTerritory.dice}🎲, ${toPlayer?.name || 'Unknown'})`;
                validAttacks.push({
                  label: attackLabel,
                  value: `${fromTerritory.id}:${toTerritory.id}`
                });
              }
            }
          }

          return validAttacks.map(a => a.value);
        },
        action: {
          labels: function() {
            // Provide human-readable labels for the attack options
            const validAttacks = [];
            const playerTerritories = this.game.territories.filter(
              t => t.playerId === this.actor.id && t.dice >= 2
            );

            for (let fromTerritory of playerTerritories) {
              for (let neighborId of fromTerritory.neighbors) {
                const toTerritory = this.game.territories.find(t => t.id === neighborId);
                if (toTerritory && toTerritory.playerId !== this.actor.id && toTerritory.playerId !== null) {
                  const toPlayer = this.game.players.find(p => p.id === toTerritory.playerId);
                  const attackLabel = `Territory ${fromTerritory.id} (${fromTerritory.dice}🎲) → Territory ${toTerritory.id} (${toTerritory.dice}🎲, ${toPlayer?.name || 'Unknown'})`;
                  validAttacks.push({
                    key: `${fromTerritory.id}:${toTerritory.id}`,
                    value: attackLabel
                  });
                }
              }
            }

            return validAttacks;
          },
          run: function () {
            // Parse the attack target (format: "fromId:toId")
            const [fromIdStr, toIdStr] = this.target.split(':');
            const fromId = parseInt(fromIdStr);
            const toId = parseInt(toIdStr);

            if (isNaN(fromId) || isNaN(toId)) {
              this.game.sendAlert("Invalid attack selection", [this.actor.id]);
              return;
            }

            // Execute the attack
            const result = this.game.attack(this.actor.id, fromId, toId);
            if (!result.success) {
              this.game.sendAlert(result.message, [this.actor.id]);
            }
          },
        },
        shouldMeet: function () {
          // Only show this meeting if it's the player's turn
          if (this.player.id !== this.game.currentTurnPlayerId) {
            return false;
          }

          // Check if player has any valid attacks
          const playerTerritories = this.game.territories.filter(
            t => t.playerId === this.player.id && t.dice >= 2
          );

          for (let fromTerritory of playerTerritories) {
            for (let neighborId of fromTerritory.neighbors) {
              const toTerritory = this.game.territories.find(t => t.id === neighborId);
              if (toTerritory && toTerritory.playerId !== this.player.id && toTerritory.playerId !== null) {
                return true; // At least one valid attack exists
              }
            }
          }

          return false; // No valid attacks available
        },
      },
    };
  }
};

