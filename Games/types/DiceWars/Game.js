const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

module.exports = class DiceWarsGame extends Game {
  /**
   * @param {object} options
   */
  constructor(options) {
    super(options);

    this.type = "DiceWars";
    this.Player = Player;
    this.mapSize = parseInt(options.settings.mapSize) || 30; // number of territories
    this.maxDicePerTerritory = parseInt(options.settings.maxDice) || 8; // max dice per territory (4, 8, or 16)
    this.gameStarted = false;
    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      {
        name: "Play",
        length: options.settings.stateLengths["Play"] ?? 300,
      },
    ];

    /**
     * @type {Array<{id: number, playerId: string, dice: number, x: number, y: number, neighbors: number[]}>}
     */
    this.territories = [];

    /**
     * @type {string} - ID of the player whose turn it is
     */
    this.currentTurnPlayerId = null;

    /**
     * @type {number} - Current turn number (increments each full round)
     */
    this.turnNumber = 0;

    /**
     * @type {number} - Current round number (increments after all players have taken a turn)
     */
    this.roundNumber = 0;

    /**
     * @type {boolean} - Whether the current player has attacked this turn
     */
    this.hasAttacked = false;

    /**
     * @type {Array<string>} - Ordered list of player IDs for turn order
     */
    this.turnOrder = [];

    /**
     * @type {number} - Index in turnOrder for current player
     */
    this.turnIndex = 0;

    /**
     * @type {Object<string, number>} - Surplus dice storage for each player (playerId -> surplus count)
     */
    this.surplusDice = {};
  }

  incrementState() {
    const previousState = this.getStateName();
    super.incrementState();

    const state = this.getStateInfo().name;
    if (state === "Play" && previousState === "Pregame") {
      this.startGame();
    }
  }

  /**
   * Generates a hex grid map with territories
   */
  generateHexMap() {
    const territories = [];
    const gridRadius = Math.ceil(Math.sqrt(this.mapSize / 3.5)); // approximate hex grid radius
    let territoryId = 0;

    // Generate hex grid using axial coordinates
    for (let q = -gridRadius; q <= gridRadius; q++) {
      for (let r = -gridRadius; r <= gridRadius; r++) {
        if (Math.abs(q + r) <= gridRadius && territoryId < this.mapSize) {
          // Convert axial to pixel coordinates for display
          const x = q * 1.5;
          const y = (q * Math.sqrt(3) / 2) + (r * Math.sqrt(3));
          
          territories.push({
            id: territoryId,
            playerId: null,
            dice: 1,
            x: x,
            y: y,
            q: q, // axial coordinate
            r: r, // axial coordinate
            neighbors: [],
          });
          territoryId++;
        }
      }
    }

    // Calculate neighbors based on axial coordinates
    for (let territory of territories) {
      const neighbors = [];
      const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
      ];

      for (let dir of directions) {
        const neighborQ = territory.q + dir.q;
        const neighborR = territory.r + dir.r;
        const neighbor = territories.find(t => t.q === neighborQ && t.r === neighborR);
        if (neighbor) {
          neighbors.push(neighbor.id);
        }
      }
      territory.neighbors = neighbors;
    }

    return territories;
  }

  /**
   * Distributes territories randomly among players
   * For first round, last 3 players receive bonus dice
   */
  distributeInitialTerritories() {
    const activePlayers = this.turnOrder.map(id => this.players.find(p => p.id === id));
    const shuffledTerritories = [...this.territories].sort(() => Math.random() - 0.5);
    
    // Determine which players get first-round bonus (last 3 in turn order)
    const numPlayers = activePlayers.length;
    const bonusPlayerIds = new Set();
    if (numPlayers >= 4) {
      // Last 3 players get bonus
      for (let i = numPlayers - 3; i < numPlayers; i++) {
        bonusPlayerIds.add(activePlayers[i].id);
      }
    }
    
    let playerIndex = 0;
    for (let territory of shuffledTerritories) {
      const player = activePlayers[playerIndex % activePlayers.length];
      territory.playerId = player.id;
      
      // Base random dice: 1-3
      const baseDice = Math.floor(Math.random() * 3) + 1;
      // Add 1 bonus die for last 3 players in first round
      const bonusDice = bonusPlayerIds.has(player.id) ? 1 : 0;
      territory.dice = baseDice + bonusDice;
      
      playerIndex++;
    }

    // Initialize surplus dice storage for all players
    for (let player of activePlayers) {
      this.surplusDice[player.id] = 0;
    }
  }

  /**
   * Starts the game
   */
  startGame() {
    this.gameStarted = true;
    this.territories = this.generateHexMap();
    
    // Randomize turn order
    const activePlayers = this.players.filter(p => p.role.name === "General");
    const shuffledPlayers = [...activePlayers].sort(() => Math.random() - 0.5);
    this.turnOrder = shuffledPlayers.map(p => p.id);
    this.turnIndex = 0;
    this.roundNumber = 1;
    this.turnNumber = 1;
    
    this.distributeInitialTerritories();

    // Set first player
    if (this.turnOrder.length > 0) {
      this.currentTurnPlayerId = this.turnOrder[0];
      this.hasAttacked = false;
      
      const firstPlayer = this.players.find(p => p.id === this.currentTurnPlayerId);
      this.sendAlert(`Round 1, Turn 1: ${firstPlayer.name}'s turn!`);
      
      // Show turn order
      const playerNames = this.turnOrder.map(id => this.players.find(p => p.id === id).name);
      this.sendAlert(`Turn order: ${playerNames.join(" → ")}`);
    }

    this.sendGameState();
  }

  /**
   * Sends the current game state to all players
   */
  sendGameState() {
    // Don't send game state until game has started
    if (!this.gameStarted) return;
    
    this.broadcast("gameState", {
      territories: this.territories,
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnNumber: this.turnNumber,
      roundNumber: this.roundNumber,
      turnOrder: this.turnOrder,
      hasAttacked: this.hasAttacked,
      playerColors: this.getPlayerColors(),
      surplusDice: this.surplusDice,
      maxDicePerTerritory: this.maxDicePerTerritory,
    });
  }

  /**
   * Gets color mapping for each player
   */
  getPlayerColors() {
    const colors = ["#FF5555", "#5555FF", "#55FF55", "#FFFF55", "#FF55FF", "#55FFFF", "#FFA500", "#A020F0"];
    const activePlayers = this.players.filter(p => p.role.name === "General");
    const colorMap = {};
    activePlayers.forEach((player, index) => {
      colorMap[player.id] = colors[index % colors.length];
    });
    return colorMap;
  }

  /**
   * Attempts an attack from one territory to another
   * @param {string} playerId - ID of attacking player
   * @param {number} fromId - ID of attacking territory
   * @param {number} toId - ID of defending territory
   */
  attack(playerId, fromId, toId) {
    // Validate it's the player's turn
    if (playerId !== this.currentTurnPlayerId) {
      return { success: false, message: "Not your turn!" };
    }

    const fromTerritory = this.territories.find(t => t.id === fromId);
    const toTerritory = this.territories.find(t => t.id === toId);

    // Validate territories exist
    if (!fromTerritory || !toTerritory) {
      return { success: false, message: "Invalid territories" };
    }

    // Validate ownership and adjacency
    if (fromTerritory.playerId !== playerId) {
      return { success: false, message: "You don't own that territory" };
    }

    if (toTerritory.playerId === playerId) {
      return { success: false, message: "Can't attack your own territory" };
    }

    if (!fromTerritory.neighbors.includes(toId)) {
      return { success: false, message: "Territories are not adjacent" };
    }

    if (fromTerritory.dice < 2) {
      return { success: false, message: "Need at least 2 dice to attack" };
    }

    // Roll dice
    const attackRoll = this.rollDice(fromTerritory.dice);
    const defenseRoll = this.rollDice(toTerritory.dice);

    const attackTotal = attackRoll.reduce((a, b) => a + b, 0);
    const defenseTotal = defenseRoll.reduce((a, b) => a + b, 0);

    let result;
    if (attackTotal > defenseTotal) {
      // Attacker wins - transfer dice
      const defenderId = toTerritory.playerId;
      toTerritory.playerId = playerId;
      // Transfer all but one die, capped at max dice per territory
      toTerritory.dice = Math.min(fromTerritory.dice - 1, this.maxDicePerTerritory);
      fromTerritory.dice = 1;
      
      result = {
        success: true,
        won: true,
        attackRoll,
        defenseRoll,
        attackTotal,
        defenseTotal,
        fromId,
        toId,
        defenderId,
      };

      // Check if defender is eliminated
      this.checkElimination(defenderId);
    } else {
      // Defender wins
      fromTerritory.dice = 1;
      result = {
        success: true,
        won: false,
        attackRoll,
        defenseRoll,
        attackTotal,
        defenseTotal,
        fromId,
        toId,
      };
    }

    this.hasAttacked = true;
    this.sendGameState();
    this.broadcast("attackResult", result);

    // Check for winner
    this.checkWinCondition();

    return result;
  }

  /**
   * Rolls n six-sided dice
   * @param {number} n - Number of dice to roll
   * @returns {number[]} - Array of dice results
   */
  rollDice(n) {
    const rolls = [];
    for (let i = 0; i < n; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls;
  }

  /**
   * Checks if a player has been eliminated
   * @param {string} playerId - Player to check
   */
  checkElimination(playerId) {
    const playerTerritories = this.territories.filter(t => t.playerId === playerId);
    if (playerTerritories.length === 0) {
      const player = this.players.find(p => p.id === playerId);
      if (player) {
        player.kill();
        this.sendAlert(`${player.name} has been eliminated!`);
      }
    }
  }

  /**
   * Ends the current player's turn
   * @param {string} playerId - ID of player ending turn
   */
  endTurn(playerId) {
    if (playerId !== this.currentTurnPlayerId) {
      return { success: false, message: "Not your turn!" };
    }

    // Award bonus dice based on largest connected region
    this.awardBonusDice(playerId);

    // Move to next player in turn order
    this.turnIndex++;
    
    // Filter turn order to only include alive players
    const aliveTurnOrder = this.turnOrder.filter(id => {
      const player = this.players.find(p => p.id === id);
      return player && player.alive;
    });

    // Check if round is complete
    if (this.turnIndex >= aliveTurnOrder.length) {
      this.turnIndex = 0;
      this.roundNumber++;
    }

    // Update turn order if players have been eliminated
    if (aliveTurnOrder.length < this.turnOrder.length) {
      this.turnOrder = aliveTurnOrder;
    }

    this.currentTurnPlayerId = this.turnOrder[this.turnIndex];
    this.hasAttacked = false;
    this.turnNumber++;

    const currentPlayer = this.players.find(p => p.id === this.currentTurnPlayerId);
    this.sendGameState();
    this.sendAlert(`Round ${this.roundNumber}, Turn ${this.turnNumber}: ${currentPlayer.name}'s turn`);

    return { success: true };
  }

  /**
   * Awards bonus dice based on largest connected territory region
   * Implements surplus dice storage system
   * @param {string} playerId - Player to award dice to
   */
  awardBonusDice(playerId) {
    const playerTerritories = this.territories.filter(t => t.playerId === playerId);
    const largestRegion = this.findLargestConnectedRegion(playerId);
    let bonusDice = largestRegion.length;

    // Add any stored surplus dice
    if (this.surplusDice[playerId]) {
      bonusDice += this.surplusDice[playerId];
      this.surplusDice[playerId] = 0;
    }

    let distributedDice = 0;
    let surplusDice = 0;

    // Distribute bonus dice to random territories (respecting max dice limit)
    for (let i = 0; i < bonusDice; i++) {
      const eligibleTerritories = playerTerritories.filter(t => t.dice < this.maxDicePerTerritory);
      if (eligibleTerritories.length > 0) {
        const randomTerritory = eligibleTerritories[Math.floor(Math.random() * eligibleTerritories.length)];
        randomTerritory.dice++;
        distributedDice++;
      } else {
        // All territories are at max - store as surplus
        surplusDice++;
      }
    }

    // Store surplus dice (max 4x the max dice limit)
    const maxSurplus = this.maxDicePerTerritory * 4;
    this.surplusDice[playerId] = Math.min(surplusDice, maxSurplus);

    if (bonusDice > 0) {
      const player = this.players.find(p => p.id === playerId);
      let message = `${player.name} received ${bonusDice} bonus dice`;
      if (distributedDice < bonusDice) {
        message += ` (${distributedDice} placed, ${this.surplusDice[playerId]} stored)`;
      }
      this.sendAlert(message);
    }
  }

  /**
   * Finds the largest connected region of territories for a player
   * @param {string} playerId - Player ID
   * @returns {number[]} - Array of territory IDs in largest region
   */
  findLargestConnectedRegion(playerId) {
    const playerTerritories = this.territories.filter(t => t.playerId === playerId);
    const visited = new Set();
    let largestRegion = [];

    for (let territory of playerTerritories) {
      if (!visited.has(territory.id)) {
        const region = this.exploreRegion(territory.id, playerId, visited);
        if (region.length > largestRegion.length) {
          largestRegion = region;
        }
      }
    }

    return largestRegion;
  }

  /**
   * Explores a connected region using BFS
   * @param {number} startId - Starting territory ID
   * @param {string} playerId - Player ID
   * @param {Set} visited - Set of visited territory IDs
   * @returns {number[]} - Array of territory IDs in this region
   */
  exploreRegion(startId, playerId, visited) {
    const region = [];
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const currentId = queue.shift();
      region.push(currentId);

      const currentTerritory = this.territories.find(t => t.id === currentId);
      for (let neighborId of currentTerritory.neighbors) {
        const neighbor = this.territories.find(t => t.id === neighborId);
        if (neighbor.playerId === playerId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return region;
  }

  /**
   * Checks if there's a winner
   */
  checkWinCondition() {
    const activePlayers = this.players.filter(p => p.role.name === "General" && p.alive);
    
    if (activePlayers.length === 1) {
      const winners = new Winners();
      winners.addPlayer(activePlayers[0], "DiceWars");
      this.endGame(winners);
    }
  }

  /**
   * Starts the game; called by main game flow.
   */
  start() {
    super.start();
  }

  /**
   * Processes when a player leaves the game.
   * @param {Player} player
   */
  async playerLeave(player) {
    // Transfer player's territories to neutral or eliminate them
    for (let territory of this.territories) {
      if (territory.playerId === player.id) {
        territory.playerId = null;
        territory.dice = 1;
      }
    }

    // Remove player from turn order
    const playerIndex = this.turnOrder.indexOf(player.id);
    if (playerIndex !== -1) {
      this.turnOrder.splice(playerIndex, 1);
      
      // Adjust turn index if needed
      if (this.turnIndex > playerIndex) {
        this.turnIndex--;
      } else if (this.turnIndex >= this.turnOrder.length && this.turnOrder.length > 0) {
        this.turnIndex = 0;
      }
    }

    // If it was this player's turn, move to next player
    if (this.currentTurnPlayerId === player.id && this.turnOrder.length > 0) {
      this.currentTurnPlayerId = this.turnOrder[this.turnIndex % this.turnOrder.length];
      const nextPlayer = this.players.find(p => p.id === this.currentTurnPlayerId);
      if (nextPlayer) {
        this.sendAlert(`${nextPlayer.name}'s turn (after ${player.name} left)`);
      }
    }

    this.sendGameState();
    await super.playerLeave(player);
    this.checkWinCondition();
  }

  /**
   * Ends the game with the given winners.
   * @param {Winners} winners
   */
  async endGame(winners) {
    await super.endGame(winners);
  }
};