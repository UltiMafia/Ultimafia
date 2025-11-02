const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

module.exports = class DiceWarsGame extends Game {
  /**
   * @param {object} options
   */
  constructor(options) {
    super(options);

    this.type = "Dice Wars";
    this.Player = Player;
    this.mapSize = parseInt(options.settings.mapSize) || 45; // number of territories
    this.maxDicePerTerritory = parseInt(options.settings.maxDice) || 8; // max dice per territory (4, 8, or 16)
    this.gameStarted = false;
    this.states = [
      {
        name: "Postgame",
      },
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
   * Generates a rectangular hex grid map with territories and ocean tiles
   * Uses offset coordinates for a rectangular layout
   */
  generateHexMap() {
    // Determine grid dimensions based on mapSize
    // Target approximately 40% of hexes to be playable territories, rest are ocean
    const totalHexes = Math.ceil(this.mapSize / 0.4);
    const aspectRatio = 1.5; // width to height ratio
    const gridHeight = Math.ceil(Math.sqrt(totalHexes / aspectRatio));
    const gridWidth = Math.ceil(totalHexes / gridHeight);

    console.log(
      `Generating ${gridWidth}x${gridHeight} hex grid for ${this.mapSize} territories`
    );

    // First, create a full rectangular grid of hexes (offset coordinates)
    const hexGrid = [];
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        // Convert offset coordinates to axial for consistent neighbor calculation
        const q = col - Math.floor(row / 2);
        const r = row;

        hexGrid.push({
          col: col,
          row: row,
          q: q,
          r: r,
          territoryId: null, // Will be assigned during territory generation
          isOcean: true, // Default to ocean, will be set to false for territories
        });
      }
    }

    // Generate random territories using flood-fill algorithm
    const territories = this.generateRandomTerritories(
      hexGrid,
      gridWidth,
      gridHeight
    );

    // Mark ocean hexes and create neighbor relationships
    for (let hex of hexGrid) {
      const neighbors = [];
      const directions = this.getHexDirections(hex.row);

      for (let dir of directions) {
        const neighborCol = hex.col + dir.col;
        const neighborRow = hex.row + dir.row;
        const neighbor = hexGrid.find(
          (h) => h.col === neighborCol && h.row === neighborRow
        );
        if (neighbor) {
          neighbors.push({
            col: neighbor.col,
            row: neighbor.row,
            territoryId: neighbor.territoryId,
          });
        }
      }
      hex.neighbors = neighbors;
    }

    // Build final territory list with neighbor IDs
    // Check ALL hexes in each territory to find neighbors
    for (let territory of territories) {
      const territoryHexes = hexGrid.filter(
        (h) => h.territoryId === territory.id && !h.isOcean
      );
      const neighborIds = new Set();

      // Check neighbors of all hexes in this territory
      for (let hex of territoryHexes) {
        for (let neighborInfo of hex.neighbors) {
          const neighborHex = hexGrid.find(
            (h) => h.col === neighborInfo.col && h.row === neighborInfo.row
          );
          if (
            neighborHex &&
            !neighborHex.isOcean &&
            neighborHex.territoryId !== null &&
            neighborHex.territoryId !== territory.id
          ) {
            neighborIds.add(neighborHex.territoryId);
          }
        }
      }
      territory.neighbors = Array.from(neighborIds);
    }

    // Store grid info for rendering
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.hexGrid = hexGrid;

    return territories;
  }

  /**
   * Get neighbor directions for hex grid using offset coordinates
   * Even and odd rows have different offset patterns
   */
  getHexDirections(row) {
    const isEven = row % 2 === 0;
    if (isEven) {
      // Even rows
      return [
        { col: 1, row: 0 }, // E
        { col: 0, row: -1 }, // NE
        { col: -1, row: -1 }, // NW
        { col: -1, row: 0 }, // W
        { col: -1, row: 1 }, // SW
        { col: 0, row: 1 }, // SE
      ];
    } else {
      // Odd rows
      return [
        { col: 1, row: 0 }, // E
        { col: 1, row: -1 }, // NE
        { col: 0, row: -1 }, // NW
        { col: -1, row: 0 }, // W
        { col: 0, row: 1 }, // SW
        { col: 1, row: 1 }, // SE
      ];
    }
  }

  /**
   * Generates random territories using a region-growing algorithm
   */
  generateRandomTerritories(hexGrid, gridWidth, gridHeight) {
    const territories = [];
    const availableHexes = [...hexGrid];
    let territoryId = 0;

    // Track total hexes used to ensure we don't exceed the target
    // We want approximately 70% of hexes to be territories, 30% ocean
    const totalHexes = hexGrid.length;
    const targetTerritoryHexes = Math.floor(totalHexes * 0.7);
    let hexesUsed = 0;

    // Continue creating territories until we hit mapSize OR run out of hex budget
    while (
      territoryId < this.mapSize &&
      availableHexes.length > 0 &&
      hexesUsed < targetTerritoryHexes
    ) {
      // Pick a random starting hex for this territory
      const startIndex = Math.floor(Math.random() * availableHexes.length);
      const startHex = availableHexes[startIndex];

      // Determine random territory size (1-5 hexes, weighted toward smaller)
      // But don't exceed the remaining hex budget
      const remainingBudget = targetTerritoryHexes - hexesUsed;
      const sizeRoll = Math.random();
      let targetSize;
      if (sizeRoll < 0.4) targetSize = 1;
      else if (sizeRoll < 0.7) targetSize = 2;
      else if (sizeRoll < 0.85) targetSize = 3;
      else if (sizeRoll < 0.95) targetSize = 4;
      else targetSize = 5;

      // Cap the size to remaining budget
      targetSize = Math.min(targetSize, remainingBudget);

      // Skip if no budget left
      if (targetSize < 1) break;

      // Grow territory from starting hex
      const territoryHexes = [startHex];
      startHex.territoryId = territoryId;
      startHex.isOcean = false;
      hexesUsed++;

      // Remove from available
      const startIdx = availableHexes.findIndex(
        (h) => h.col === startHex.col && h.row === startHex.row
      );
      availableHexes.splice(startIdx, 1);

      // Expand territory by adding adjacent hexes
      let attempts = 0;
      while (
        territoryHexes.length < targetSize &&
        attempts < targetSize * 10 &&
        hexesUsed < targetTerritoryHexes
      ) {
        attempts++;

        // Pick a random hex in current territory to expand from
        const expandFrom =
          territoryHexes[Math.floor(Math.random() * territoryHexes.length)];
        const directions = this.getHexDirections(expandFrom.row);

        // Shuffle directions for randomness
        const shuffledDirections = [...directions].sort(
          () => Math.random() - 0.5
        );

        for (let dir of shuffledDirections) {
          const neighborCol = expandFrom.col + dir.col;
          const neighborRow = expandFrom.row + dir.row;

          const neighbor = availableHexes.find(
            (h) => h.col === neighborCol && h.row === neighborRow
          );

          if (neighbor) {
            neighbor.territoryId = territoryId;
            neighbor.isOcean = false;
            territoryHexes.push(neighbor);
            hexesUsed++;

            const neighborIdx = availableHexes.findIndex(
              (h) => h.col === neighbor.col && h.row === neighbor.row
            );
            availableHexes.splice(neighborIdx, 1);

            if (
              territoryHexes.length >= targetSize ||
              hexesUsed >= targetTerritoryHexes
            )
              break;
          }
        }
      }

      // Create territory object
      // Use the center hex for display coordinates
      // Make sure we pick a hex that's actually part of the territory (not ocean)
      const validHexes = territoryHexes.filter(
        (h) => !h.isOcean && h.territoryId === territoryId
      );
      const centerHex =
        validHexes.length > 0
          ? validHexes[Math.floor(validHexes.length / 2)]
          : startHex;

      territories.push({
        id: territoryId,
        playerId: null,
        dice: 1,
        col: centerHex.col,
        row: centerHex.row,
        q: centerHex.q,
        r: centerHex.r,
        hexes: territoryHexes.length, // For debugging
        neighbors: [], // Will be populated later
      });

      territoryId++;
    }

    // Remove island territories (territories with no neighboring territories)
    const islandsRemoved = this.removeIslandTerritories(
      territories,
      hexGrid,
      gridWidth,
      gridHeight
    );

    // Validate and clean up any inconsistent hex states
    this.validateHexStates(hexGrid);

    // Recalculate hex usage after island removal
    const finalHexesUsed = hexGrid.filter((h) => !h.isOcean).length;
    const oceanHexes = totalHexes - finalHexesUsed;
    const percentTerritories = ((finalHexesUsed / totalHexes) * 100).toFixed(1);
    const percentOcean = ((oceanHexes / totalHexes) * 100).toFixed(1);
    console.log(
      `Generated ${territories.length} territories using ${finalHexesUsed}/${totalHexes} hexes (${percentTerritories}% territories, ${percentOcean}% ocean)`
    );
    if (islandsRemoved > 0) {
      console.log(`Removed ${islandsRemoved} island territories`);
    }
    return territories;
  }

  /**
   * Removes island territories (territories with no neighboring territories)
   * @param {Array} territories - Array of territory objects
   * @param {Array} hexGrid - The hex grid
   * @param {number} gridWidth - Grid width
   * @param {number} gridHeight - Grid height
   * @returns {number} - Number of islands removed
   */
  removeIslandTerritories(territories, hexGrid, gridWidth, gridHeight) {
    let islandsRemoved = 0;
    const territoriesToRemove = [];

    for (let territory of territories) {
      // Get all hexes for this territory (excluding ocean hexes)
      const territoryHexes = hexGrid.filter(
        (h) => h.territoryId === territory.id && !h.isOcean
      );
      let hasNeighboringTerritory = false;

      // Check if any hex in this territory has a neighbor that belongs to a different territory
      for (let hex of territoryHexes) {
        const directions = this.getHexDirections(hex.row);

        for (let dir of directions) {
          const neighborCol = hex.col + dir.col;
          const neighborRow = hex.row + dir.row;
          const neighbor = hexGrid.find(
            (h) => h.col === neighborCol && h.row === neighborRow
          );

          if (
            neighbor &&
            !neighbor.isOcean &&
            neighbor.territoryId !== null &&
            neighbor.territoryId !== territory.id
          ) {
            hasNeighboringTerritory = true;
            break;
          }
        }

        if (hasNeighboringTerritory) break;
      }

      // If this territory has no neighboring territories, mark it for removal
      if (!hasNeighboringTerritory) {
        territoriesToRemove.push(territory.id);
        islandsRemoved++;

        // Convert all hexes back to ocean
        for (let hex of territoryHexes) {
          hex.territoryId = null;
          hex.isOcean = true;
        }
      }
    }

    // Remove island territories from the territories array
    for (let i = territories.length - 1; i >= 0; i--) {
      if (territoriesToRemove.includes(territories[i].id)) {
        territories.splice(i, 1);
      }
    }

    return islandsRemoved;
  }

  /**
   * Validates and fixes inconsistent hex states
   * Ensures no hex has both a territoryId and isOcean: true
   * @param {Array} hexGrid - The hex grid
   */
  validateHexStates(hexGrid) {
    let fixedCount = 0;
    for (let hex of hexGrid) {
      // If a hex has a territoryId, it should NOT be ocean
      if (hex.territoryId !== null && hex.isOcean) {
        console.warn(
          `Fixing inconsistent hex at (${hex.col}, ${hex.row}): has territoryId ${hex.territoryId} but isOcean=true`
        );
        hex.isOcean = false;
        fixedCount++;
      }
      // If a hex has no territoryId, it SHOULD be ocean
      if (hex.territoryId === null && !hex.isOcean) {
        hex.isOcean = true;
        fixedCount++;
      }
    }
    if (fixedCount > 0) {
      console.log(`Fixed ${fixedCount} inconsistent hex states`);
    }
  }

  /**
   * Distributes territories randomly among players
   * Bonus dice rules:
   * - 2-4 players: No bonus
   * - 5-7 players: Last 2 players get +1 die
   * - 8+ players: Last 3 players get +1 die
   */
  distributeInitialTerritories() {
    const activePlayers = this.turnOrder.map((id) =>
      this.players.array().find((p) => p.id === id)
    );
    const shuffledTerritories = [...this.territories].sort(
      () => Math.random() - 0.5
    );

    // Determine which players get first-round bonus based on player count
    const numPlayers = activePlayers.length;
    const bonusPlayerIds = new Set();

    if (numPlayers >= 8) {
      // Last 3 players get bonus for 8+ player games
      for (let i = numPlayers - 3; i < numPlayers; i++) {
        bonusPlayerIds.add(activePlayers[i].id);
      }
    } else if (numPlayers >= 5) {
      // Last 2 players get bonus for 5-7 player games
      for (let i = numPlayers - 2; i < numPlayers; i++) {
        bonusPlayerIds.add(activePlayers[i].id);
      }
    }
    // 2-4 players: no bonus

    let playerIndex = 0;
    for (let territory of shuffledTerritories) {
      const player = activePlayers[playerIndex % activePlayers.length];
      territory.playerId = player.id;

      // Base random dice: 1-3
      const baseDice = Math.floor(Math.random() * 3) + 1;
      // Add 1 bonus die for eligible players based on player count
      const bonusDice = bonusPlayerIds.has(player.id) ? 1 : 0;
      territory.dice = Math.min(baseDice + bonusDice, this.maxDicePerTerritory);

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
    const activePlayers = this.players
      .array()
      .filter((p) => p.role.name === "General");
    const shuffledPlayers = [...activePlayers].sort(() => Math.random() - 0.5);
    this.turnOrder = shuffledPlayers.map((p) => p.id);
    this.turnIndex = 0;
    this.roundNumber = 1;
    this.turnNumber = 1;

    this.distributeInitialTerritories();

    // Set first player
    if (this.turnOrder.length > 0) {
      this.currentTurnPlayerId = this.turnOrder[0];
      this.hasAttacked = false;

      const firstPlayer = this.players
        .array()
        .find((p) => p.id === this.currentTurnPlayerId);
      //this.sendAlert(`Round 1, Turn 1: ${firstPlayer.name}'s turn!`);

      // Show turn order
      const playerNames = this.turnOrder.map(
        (id) => this.players.array().find((p) => p.id === id).name
      );
      //this.sendAlert(`Turn order: ${playerNames.join(" → ")}`);
    }

    this.sendGameState();
  }

  /**
   * Override getStateInfo to include game state in extraInfo
   * This allows the history system to track game progression
   */
  getStateInfo(state) {
    const info = super.getStateInfo(state);

    // Add game state to extraInfo so it's stored in history
    if (this.gameStarted) {
      info.extraInfo = {
        territories: this.territories,
        hexGrid: this.hexGrid,
        gridWidth: this.gridWidth,
        gridHeight: this.gridHeight,
        currentTurnPlayerId: this.currentTurnPlayerId,
        turnNumber: this.turnNumber,
        roundNumber: this.roundNumber,
        turnOrder: this.turnOrder,
        hasAttacked: this.hasAttacked,
        playerColors: this.getPlayerColors(),
        surplusDice: this.surplusDice,
        maxDicePerTerritory: this.maxDicePerTerritory,
      };
    }

    return info;
  }

  /**
   * Sends the current game state to all players
   */
  sendGameState() {
    // Don't send game state until game has started
    if (!this.gameStarted) {
      console.log("Not sending game state - game not started");
      return;
    }

    const state = {
      territories: this.territories,
      hexGrid: this.hexGrid,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnNumber: this.turnNumber,
      roundNumber: this.roundNumber,
      turnOrder: this.turnOrder,
      hasAttacked: this.hasAttacked,
      playerColors: this.getPlayerColors(),
      surplusDice: this.surplusDice,
      maxDicePerTerritory: this.maxDicePerTerritory,
    };

    console.log(
      "Broadcasting game state - Turn:",
      this.turnNumber,
      "Current player:",
      this.currentTurnPlayerId
    );
    this.broadcast("gameState", state);
  }

  /**
   * Gets color mapping for each player
   */
  getPlayerColors() {
    const colors = [
      "#FF5555",
      "#5555FF",
      "#55FF55",
      "#FFFF55",
      "#FF55FF",
      "#55FFFF",
      "#FFA500",
      "#A020F0",
    ];
    const activePlayers = this.players
      .array()
      .filter((p) => p.role.name === "General");
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

    const fromTerritory = this.territories.find((t) => t.id === fromId);
    const toTerritory = this.territories.find((t) => t.id === toId);

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

    const attacker = this.players.array().find((p) => p.id === playerId);
    const defender = this.players.array().find((p) => p.id === toTerritory.playerId);
    
    let result;
    if (attackTotal > defenseTotal) {
      // Attacker wins - transfer dice
      const defenderId = toTerritory.playerId;
      toTerritory.playerId = playerId;
      // Transfer all but one die, capped at max dice per territory
      toTerritory.dice = Math.min(
        fromTerritory.dice - 1,
        this.maxDicePerTerritory
      );
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

      // Send chat message for successful attack
      this.sendAlert(
        `${attacker.name} attacked ${defender.name}! ` +
        `Attacker rolled [${attackRoll.join(", ")}] = ${attackTotal}. ` +
        `Defender rolled [${defenseRoll.join(", ")}] = ${defenseTotal}. ` +
        `Attack successful!`
      );

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

      // Send chat message for failed attack
      this.sendAlert(
        `${attacker.name} attacked ${defender.name}! ` +
        `Attacker rolled [${attackRoll.join(", ")}] = ${attackTotal}. ` +
        `Defender rolled [${defenseRoll.join(", ")}] = ${defenseTotal}. ` +
        `Attack failed!`
      );
    }

    this.hasAttacked = true;

    // Update history with new game state
    const stateInfo = this.getStateInfo();
    this.addStateExtraInfoToHistories(stateInfo.extraInfo);

    this.sendGameState();

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
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
    if (playerTerritories.length === 0) {
      const player = this.players.array().find((p) => p.id === playerId);
      if (player) {
        player.kill();
        this.sendAlert(`${player.name} has been conquered!`);
      }
    }
  }

  /**
   * Ends the current player's turn
   * @param {string} playerId - ID of player ending turn
   */
  endTurn(playerId) {
    if (playerId !== this.currentTurnPlayerId) {
      console.log(
        "Not your turn! Current turn:",
        this.currentTurnPlayerId,
        "Attempted:",
        playerId
      );
      return { success: false, message: "Not your turn!" };
    }

    console.log("Ending turn for", playerId);

    // Move to next player in turn order
    this.turnIndex++;

    // Filter turn order to only include alive players
    const aliveTurnOrder = this.turnOrder.filter((id) => {
      const player = this.players.array().find((p) => p.id === id);
      return player && player.alive;
    });

    console.log(
      "Turn index:",
      this.turnIndex,
      "Alive players:",
      aliveTurnOrder.length
    );

    // Check if round is complete
    const isRoundComplete = this.turnIndex >= aliveTurnOrder.length;
    if (isRoundComplete) {
      this.turnIndex = 0;
      this.roundNumber++;
      console.log(
        "Round complete, resetting to index 0, new round:",
        this.roundNumber
      );

      // Award bonus dice to all players at the end of the round
      this.awardBonusDiceToAllPlayers();
    }

    // Update turn order if players have been eliminated
    if (aliveTurnOrder.length < this.turnOrder.length) {
      this.turnOrder = aliveTurnOrder;
    }

    this.currentTurnPlayerId = this.turnOrder[this.turnIndex];
    this.hasAttacked = false;
    this.turnNumber++;

    const currentPlayer = this.players
      .array()
      .find((p) => p.id === this.currentTurnPlayerId);

    console.log(
      "New current turn player:",
      this.currentTurnPlayerId,
      currentPlayer?.name
    );

    // Update history with new turn state
    const stateInfo = this.getStateInfo();
    this.addStateExtraInfoToHistories(stateInfo.extraInfo);

    this.sendGameState();
    this.sendAlert(
      `Round ${this.roundNumber}, Turn ${this.turnNumber}: ${currentPlayer.name}'s turn`
    );

    return { success: true };
  }

  /**
   * Awards bonus dice based on largest connected territory region
   * Implements surplus dice storage system
   * @param {string} playerId - Player to award dice to
   */
  awardBonusDice(playerId) {
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
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
      const eligibleTerritories = playerTerritories.filter(
        (t) => t.dice < this.maxDicePerTerritory
      );
      if (eligibleTerritories.length > 0) {
        const randomTerritory =
          eligibleTerritories[
            Math.floor(Math.random() * eligibleTerritories.length)
          ];
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
      const player = this.players.array().find((p) => p.id === playerId);
      let message = `${player.name} received ${bonusDice} bonus dice`;
      if (distributedDice < bonusDice) {
        message += ` (${distributedDice} placed, ${this.surplusDice[playerId]} stored)`;
      }
      this.sendAlert(message);
    }
  }

  /**
   * Awards bonus dice to all players at the end of a round
   */
  awardBonusDiceToAllPlayers() {
    // Award dice to all alive players
    for (let playerId of this.turnOrder) {
      const player = this.players.array().find((p) => p.id === playerId);
      if (player && player.alive) {
        this.awardBonusDice(playerId);
      }
    }
  }

  /**
   * Finds the largest connected region of territories for a player
   * @param {string} playerId - Player ID
   * @returns {number[]} - Array of territory IDs in largest region
   */
  findLargestConnectedRegion(playerId) {
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
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

      const currentTerritory = this.territories.find((t) => t.id === currentId);
      for (let neighborId of currentTerritory.neighbors) {
        const neighbor = this.territories.find((t) => t.id === neighborId);
        if (neighbor.playerId === playerId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    return region;
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
    // Kill the player (counts as elimination)
    if (player.alive) {
      player.kill();
      this.sendAlert(`${player.name} has surrendered!`);
    }

    // Transfer player's territories to neutral
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
      } else if (
        this.turnIndex >= this.turnOrder.length &&
        this.turnOrder.length > 0
      ) {
        this.turnIndex = 0;
      }
    }

    // If it was this player's turn, move to next player
    if (this.currentTurnPlayerId === player.id && this.turnOrder.length > 0) {
      this.currentTurnPlayerId =
        this.turnOrder[this.turnIndex % this.turnOrder.length];
      const nextPlayer = this.players
        .array()
        .find((p) => p.id === this.currentTurnPlayerId);
      if (nextPlayer) {
        this.sendAlert(`${nextPlayer.name}'s turn (after ${player.name} left)`);
      }
    }

    this.sendGameState();
    await super.playerLeave(player);
  }

  /**
   * Ends the game with the given winners.
   * @param {Winners} winners
   */
  async endGame(winners) {
    await super.endGame(winners);
  }
};
