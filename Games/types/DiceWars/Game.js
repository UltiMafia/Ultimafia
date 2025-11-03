const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

module.exports = class DiceWarsGame extends Game {

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

    this.territories = [];
    this.currentTurnPlayerId = null;
    this.turnNumber = 0;
    this.roundNumber = 0;
    this.hasAttacked = false;
    this.turnOrder = [];
    this.turnIndex = 0;
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

    // Build territory neighbor relationships by checking hex adjacency
    for (let territory of territories) {
      const territoryHexes = hexGrid.filter(
        (h) => h.territoryId === territory.id && !h.isOcean
      );
      const neighborIds = new Set();

      // Check all hexes in this territory
      for (let hex of territoryHexes) {
        const directions = this.getHexDirections(hex.col, hex.row);
        
        // Check all 6 neighbors of this hex
        for (let dir of directions) {
          const neighborCol = hex.col + dir.col;
          const neighborRow = hex.row + dir.row;
          const neighbor = hexGrid.find(
            (h) => h.col === neighborCol && h.row === neighborRow
          );
          
          // If neighbor is land and belongs to a different territory, add it
          if (
            neighbor &&
            !neighbor.isOcean &&
            neighbor.territoryId !== null &&
            neighbor.territoryId !== territory.id
          ) {
            neighborIds.add(neighbor.territoryId);
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
   * Uses odd-q vertical layout (flat-top hexes, odd columns offset down)
   * Even and odd columns have different offset patterns
   */
  getHexDirections(col, row) {
    const isEvenCol = col % 2 === 0;
    if (isEvenCol) {
      // Even columns (not offset)
      return [
        { col: 1, row: 0 },   // E
        { col: 1, row: -1 },  // NE
        { col: 0, row: -1 },  // NW
        { col: -1, row: 0 },  // W
        { col: 0, row: 1 },   // SW
        { col: 1, row: 1 },   // SE
      ];
    } else {
      // Odd columns (offset down by 0.5)
      return [
        { col: 1, row: 0 },   // E
        { col: 0, row: -1 },  // NE
        { col: -1, row: -1 }, // NW
        { col: -1, row: 0 },  // W
        { col: -1, row: 1 },  // SW
        { col: 0, row: 1 },   // SE
      ];
    }
  }

  /**
   * Generates random territories using a connected region-growing algorithm
   * Ensures all land forms a connected mass with no islands
   */
  generateRandomTerritories(hexGrid, gridWidth, gridHeight) {
    const totalHexes = hexGrid.length;
    const targetLandHexes = Math.floor(totalHexes * 0.6); // 60% land, 40% ocean
    
    // Step 1: Create a connected land mass
    console.log(`Creating connected land mass with ~${targetLandHexes} hexes`);
    const landHexes = this.createConnectedLandMass(hexGrid, gridWidth, gridHeight, targetLandHexes);
    
    // Step 2: Divide land into territories (1-5 hexes each)
    console.log(`Dividing land into ${this.mapSize} territories`);
    const territories = this.divideLandIntoTerritories(landHexes, hexGrid, this.mapSize);
    
    // Step 3: Validate - ensure no territory is isolated
    const validTerritories = this.validateAndFixTerritories(territories, hexGrid);
    
    // Final stats
    const finalLandHexes = hexGrid.filter((h) => !h.isOcean).length;
    const oceanHexes = totalHexes - finalLandHexes;
    const percentLand = ((finalLandHexes / totalHexes) * 100).toFixed(1);
    const percentOcean = ((oceanHexes / totalHexes) * 100).toFixed(1);
    console.log(
      `Generated ${validTerritories.length} territories using ${finalLandHexes}/${totalHexes} hexes (${percentLand}% land, ${percentOcean}% ocean)`
    );
    
    return validTerritories;
  }

  /**
   * Creates a connected land mass using region growing
   */
  createConnectedLandMass(hexGrid, gridWidth, gridHeight, targetSize) {
    // Start from center of grid
    const centerCol = Math.floor(gridWidth / 2);
    const centerRow = Math.floor(gridHeight / 2);
    const startHex = hexGrid.find((h) => h.col === centerCol && h.row === centerRow);
    
    if (!startHex) return [];
    
    const landHexes = [startHex];
    startHex.isOcean = false;
    
    // Grow land mass outward from center
    const frontier = [startHex];
    const visited = new Set([`${startHex.col},${startHex.row}`]);
    
    while (landHexes.length < targetSize && frontier.length > 0) {
      // Pick a random hex from frontier to expand from
      const randomIndex = Math.floor(Math.random() * frontier.length);
      const currentHex = frontier[randomIndex];
      
      // Get neighbors
      const directions = this.getHexDirections(currentHex.col, currentHex.row);
      const neighbors = [];
      
      for (let dir of directions) {
        const neighborCol = currentHex.col + dir.col;
        const neighborRow = currentHex.row + dir.row;
        const key = `${neighborCol},${neighborRow}`;
        
        if (!visited.has(key)) {
          const neighbor = hexGrid.find(
            (h) => h.col === neighborCol && h.row === neighborRow
          );
          if (neighbor) {
            neighbors.push(neighbor);
            visited.add(key);
          }
        }
      }
      
      // Add some neighbors to land (weighted randomness for organic shape)
      if (neighbors.length > 0) {
        // Randomly decide how many neighbors to add (creates irregular coastline)
        const numToAdd = Math.min(
          neighbors.length,
          Math.floor(Math.random() * 3) + 1
        );
        
        // Shuffle and take first numToAdd
        const shuffled = neighbors.sort(() => Math.random() - 0.5);
        for (let i = 0; i < numToAdd && landHexes.length < targetSize; i++) {
          const newLand = shuffled[i];
          newLand.isOcean = false;
          landHexes.push(newLand);
          frontier.push(newLand);
        }
      }
      
      // Remove current from frontier if no more unvisited neighbors
      if (neighbors.length === 0) {
        frontier.splice(randomIndex, 1);
      }
    }
    
    return landHexes;
  }

  /**
   * Divides land mass into territories
   */
  divideLandIntoTerritories(landHexes, hexGrid, targetCount) {
    const territories = [];
    const availableLand = new Set(landHexes.map(h => `${h.col},${h.row}`));
    let territoryId = 0;
    
    // Create seed points for territories
    const seeds = [];
    const shuffledLand = [...landHexes].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < targetCount && i < shuffledLand.length; i++) {
      const seed = shuffledLand[i];
      const key = `${seed.col},${seed.row}`;
      
      if (availableLand.has(key)) {
        seeds.push(seed);
        availableLand.delete(key);
      }
    }
    
    // Grow territories from seeds
    for (let seed of seeds) {
      // Determine territory size (1-5 hexes, weighted toward smaller)
      const sizeRoll = Math.random();
      let targetSize;
      if (sizeRoll < 0.4) targetSize = 1;
      else if (sizeRoll < 0.7) targetSize = 2;
      else if (sizeRoll < 0.85) targetSize = 3;
      else if (sizeRoll < 0.95) targetSize = 4;
      else targetSize = 5;
      
      const territoryHexes = [seed];
      seed.territoryId = territoryId;
      
      // Grow territory
      const frontier = [seed];
      
      while (territoryHexes.length < targetSize && frontier.length > 0) {
        const currentHex = frontier[Math.floor(Math.random() * frontier.length)];
        const directions = this.getHexDirections(currentHex.col, currentHex.row);
        let foundNeighbor = false;
        
        // Shuffle directions for variety
        const shuffled = [...directions].sort(() => Math.random() - 0.5);
        
        for (let dir of shuffled) {
          const neighborCol = currentHex.col + dir.col;
          const neighborRow = currentHex.row + dir.row;
          const key = `${neighborCol},${neighborRow}`;
          
          if (availableLand.has(key)) {
            const neighbor = hexGrid.find(
              (h) => h.col === neighborCol && h.row === neighborRow
            );
            if (neighbor && !neighbor.isOcean) {
              neighbor.territoryId = territoryId;
              territoryHexes.push(neighbor);
              availableLand.delete(key);
              frontier.push(neighbor);
              foundNeighbor = true;
              break;
            }
          }
        }
        
        // Remove from frontier if can't expand
        if (!foundNeighbor) {
          const idx = frontier.findIndex(h => h.col === currentHex.col && h.row === currentHex.row);
          if (idx !== -1) frontier.splice(idx, 1);
        }
      }
      
      // Create territory object
      const centerHex = territoryHexes[Math.floor(territoryHexes.length / 2)];
      
      territories.push({
        id: territoryId,
        playerId: null,
        dice: 1,
        col: centerHex.col,
        row: centerHex.row,
        q: centerHex.q,
        r: centerHex.r,
        hexes: territoryHexes.length,
        neighbors: [],
      });
      
      territoryId++;
    }
    
    // Convert any remaining unassigned land hexes to ocean
    // This ensures all territories remain contiguous (no fragmentation)
    const remaining = [...availableLand];
    for (let key of remaining) {
      const [col, row] = key.split(',').map(Number);
      const hex = hexGrid.find(h => h.col === col && h.row === row);
      
      if (hex && !hex.isOcean && hex.territoryId === null) {
        hex.isOcean = true;
      }
    }
    
    return territories;
  }

  /**
   * Validates territories and ensures none are isolated
   */
  validateAndFixTerritories(territories, hexGrid) {
    const validated = [];
    
    for (let territory of territories) {
      const territoryHexes = hexGrid.filter(
        (h) => h.territoryId === territory.id && !h.isOcean
      );
      
      // Check if territory has at least one neighbor territory
      let hasNeighbor = false;
      
      for (let hex of territoryHexes) {
        const directions = this.getHexDirections(hex.col, hex.row);
        
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
            hasNeighbor = true;
            break;
          }
        }
        
        if (hasNeighbor) break;
      }
      
      if (hasNeighbor) {
        validated.push(territory);
      } else {
        // Convert isolated territory back to ocean
        console.log(`Removing isolated territory ${territory.id}`);
        for (let hex of territoryHexes) {
          hex.territoryId = null;
          hex.isOcean = true;
        }
      }
    }
    
    return validated;
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

  getPlayerColors() {
    const colors = [
      "#FF5555",
      "#5555FF",
      "#55FF55",
      "#FFFF55",
      "#FF55FF",
      "#55FFFF",
      "#FFAA00",
      "#A020F0",
      "#55AA55",
      "#964B00",
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
    const defender = this.players
      .array()
      .find((p) => p.id === toTerritory.playerId);

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

  rollDice(n) {
    const rolls = [];
    for (let i = 0; i < n; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    return rolls;
  }

  checkElimination(playerId) {
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
    if (playerTerritories.length === 0) {
      const player = this.players.array().find((p) => p.id === playerId);
      if (player && player.alive) {
        player.kill();
        this.sendAlert(`${player.name} has been conquered!`);
        
        // Check if game should end
        this.checkGameEnd();
      }
    }
  }

  checkWinConditions() {
    const Queue = require("../../core/Queue");
    const Winners = require("../../core/Winners");
    
    let finished = false;
    const winners = new Winners(this);
    const aliveCount = this.alivePlayers().length;
    const winQueue = new Queue();
    
    // Collect win checks from all player roles
    for (let player of this.players) {
      if (player.role && player.role.winCheck) {
        winQueue.enqueue(player.role.winCheck);
      }
    }
    
    // Execute all win checks
    for (let winCheck of winQueue) {
      winCheck.check({}, winners, aliveCount);
    }
    
    // Game is finished if someone won
    if (winners.groupAmt() > 0) {
      finished = true;
    } else if (aliveCount === 0) {
      // No one alive = draw
      winners.addGroup("No one");
      finished = true;
    }
    
    winners.determinePlayers();
    return [finished, winners];
  }

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

    // Check if game should end before advancing turn
    if (this.checkGameEnd()) {
      return { success: true };
    }

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

    // Check again if game should end after turn order update
    if (this.checkGameEnd()) {
      return { success: true };
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

  async endGame(winners) {
    await super.endGame(winners);
  }
};
