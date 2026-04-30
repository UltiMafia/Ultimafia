const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

module.exports = class DiceWarsGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Dice Wars";
    this.Player = Player;
    this.mapSize = parseInt(options.settings.mapSize) || 30;
    this.maxDicePerTerritory = parseInt(options.settings.maxDice) || 8;
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

    // Build hex lookup map for O(1) access
    const hexLookup = new Map();
    for (const hex of hexGrid) {
      hexLookup.set(`${hex.col},${hex.row}`, hex);
    }

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
          const neighbor = hexLookup.get(
            `${neighborCol},${neighborRow}`
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
    // Odd-q offset layout (flat-top hexes, odd columns shifted down)
    // Reference: https://www.redblobgames.com/grids/hexagons/#coordinates-offset
    const isEvenCol = col % 2 === 0;
    if (isEvenCol) {
      return [
        { col: 1, row: 0 }, // SE
        { col: 1, row: -1 }, // NE
        { col: 0, row: -1 }, // N
        { col: -1, row: -1 }, // NW
        { col: -1, row: 0 }, // SW
        { col: 0, row: 1 }, // S
      ];
    } else {
      return [
        { col: 1, row: 1 }, // SE
        { col: 1, row: 0 }, // NE
        { col: 0, row: -1 }, // N
        { col: -1, row: 0 }, // NW
        { col: -1, row: 1 }, // SW
        { col: 0, row: 1 }, // S
      ];
    }
  }

  /**
   * Generates random territories using a connected region-growing algorithm
   * Ensures all land forms a connected mass with no islands
   */
  generateRandomTerritories(hexGrid, gridWidth, gridHeight) {
    const totalHexes = hexGrid.length;
    const targetLandHexes = Math.floor(totalHexes * 0.7); // 70% land, 30% ocean

    // Step 1: Create a connected land mass
    const landHexes = this.createConnectedLandMass(
      hexGrid,
      gridWidth,
      gridHeight,
      targetLandHexes
    );

    // Step 2: Divide land into territories (1-5 hexes each)
    const territories = this.divideLandIntoTerritories(
      landHexes,
      hexGrid,
      this.mapSize
    );

    // Step 3: Validate - ensure no territory is isolated
    const validTerritories = this.validateAndFixTerritories(
      territories,
      hexGrid
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
    const startHex = hexGrid.find(
      (h) => h.col === centerCol && h.row === centerRow
    );

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
    // Build a lookup map for fast hex access
    const hexLookup = new Map();
    for (const hex of hexGrid) {
      hexLookup.set(`${hex.col},${hex.row}`, hex);
    }

    const assigned = new Set();

    // Step 1: Pick well-spaced seed hexes using farthest-point sampling
    const seeds = [];
    const firstSeed = landHexes[Math.floor(Math.random() * landHexes.length)];
    seeds.push(firstSeed);
    assigned.add(`${firstSeed.col},${firstSeed.row}`);

    // Track minimum distance from each land hex to any seed
    const minDist = new Map();
    for (const hex of landHexes) {
      const key = `${hex.col},${hex.row}`;
      const dist =
        Math.abs(hex.col - firstSeed.col) + Math.abs(hex.row - firstSeed.row);
      minDist.set(key, dist);
    }

    while (seeds.length < targetCount && seeds.length < landHexes.length) {
      // Pick the land hex farthest from all existing seeds
      let bestHex = null;
      let bestDist = -1;
      for (const hex of landHexes) {
        const key = `${hex.col},${hex.row}`;
        if (assigned.has(key)) continue;
        const dist = minDist.get(key) || 0;
        if (dist > bestDist) {
          bestDist = dist;
          bestHex = hex;
        }
      }
      if (!bestHex) break;

      seeds.push(bestHex);
      const seedKey = `${bestHex.col},${bestHex.row}`;
      assigned.add(seedKey);

      // Update minimum distances with new seed
      for (const hex of landHexes) {
        const key = `${hex.col},${hex.row}`;
        const dist =
          Math.abs(hex.col - bestHex.col) + Math.abs(hex.row - bestHex.row);
        minDist.set(key, Math.min(minDist.get(key) || Infinity, dist));
      }
    }

    // Step 2: Assign seeds to territory IDs
    const territoryHexSets = []; // territoryId -> [hex, ...]
    const frontiers = []; // territoryId -> [hex, ...]

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      seed.territoryId = i;
      territoryHexSets.push([seed]);
      frontiers.push([seed]);
    }

    // Step 3: Simultaneous BFS — grow all territories at once until every
    //         land hex is assigned (Voronoi-style flood fill, no gaps)
    const unassignedLand = new Set(
      landHexes
        .filter((h) => h.territoryId === null)
        .map((h) => `${h.col},${h.row}`)
    );

    while (unassignedLand.size > 0) {
      let anyProgress = false;

      // Each territory expands one layer per round (fair growth)
      for (let tid = 0; tid < frontiers.length; tid++) {
        const frontier = frontiers[tid];
        if (frontier.length === 0) continue;

        const nextFrontier = [];
        // Shuffle frontier for organic shapes
        const shuffled = [...frontier].sort(() => Math.random() - 0.5);

        for (const hex of shuffled) {
          const directions = this.getHexDirections(hex.col, hex.row);
          // Shuffle directions for variety
          const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);

          for (const dir of shuffledDirs) {
            const nCol = hex.col + dir.col;
            const nRow = hex.row + dir.row;
            const key = `${nCol},${nRow}`;

            if (!unassignedLand.has(key)) continue;
            const neighbor = hexLookup.get(key);
            if (!neighbor || neighbor.isOcean) continue;

            neighbor.territoryId = tid;
            territoryHexSets[tid].push(neighbor);
            nextFrontier.push(neighbor);
            unassignedLand.delete(key);
            anyProgress = true;
          }
        }

        frontiers[tid] = nextFrontier;
      }

      if (!anyProgress) break;
    }

    // Step 4: Build territory objects
    const territories = [];
    for (let tid = 0; tid < territoryHexSets.length; tid++) {
      const hexes = territoryHexSets[tid];
      if (hexes.length === 0) continue;
      const centerHex = hexes[Math.floor(hexes.length / 2)];

      territories.push({
        id: tid,
        playerId: null,
        dice: 1,
        col: centerHex.col,
        row: centerHex.row,
        q: centerHex.q,
        r: centerHex.r,
        hexes: hexes.length,
        neighbors: [],
      });
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

    const numPlayers = activePlayers.length;

    // Distribute territories as evenly as possible
    const numTerritories = shuffledTerritories.length;
    const baseCount = Math.floor(numTerritories / numPlayers);
    let remainder = numTerritories % numPlayers;

    let territoryIndex = 0;
    for (let i = 0; i < numPlayers; i++) {
      // First 'remainder' players get one extra territory
      const count = baseCount + (i < remainder ? 1 : 0);
      for (let j = 0; j < count; j++) {
        const territory = shuffledTerritories[territoryIndex];
        territory.playerId = activePlayers[i].id;
        territory.dice = Math.floor(Math.random() * 3) + 1;
        territoryIndex++;
      }
    }

    // Turn-order compensation: later players get bonus dice placed on their territories
    // Mild ramp: player at index i gets exactly i bonus dice (1 per turn-order position)
    const bonusDiceUnit = 1;

    for (let i = 0; i < numPlayers; i++) {
      this.surplusDice[activePlayers[i].id] = 0;
      const totalBonus = i * bonusDiceUnit;
      const playerTerrs = shuffledTerritories.filter(
        (t) => t.playerId === activePlayers[i].id
      );
      for (let d = 0; d < totalBonus; d++) {
        const eligible = playerTerrs.filter(
          (t) => t.dice < this.maxDicePerTerritory
        );
        if (eligible.length > 0) {
          eligible[Math.floor(Math.random() * eligible.length)].dice++;
        }
      }
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
    this.startTurnTimer();
  }

  startTurnTimer() {
    this.clearTimer("turnInactivity");
    this.createTimer("turnInactivity", 60 * 1000, () => {
      if (this.currentTurnPlayerId && this.getStateName() === "Play") {
        this.endTurn(this.currentTurnPlayerId);
      }
    });
  }

  resetTurnTimer() {
    if (this.timers["turnInactivity"]) {
      this.startTurnTimer();
    }
  }

  /**
   * Override getStateInfo to include game state in extraInfo
   * This allows the history system to track game progression
   */
  getStateInfo(state) {
    const info = super.getStateInfo(state);

    // Add game state to extraInfo so it's stored in history
    // Deep copy territories so history entries don't share mutable references
    if (this.gameStarted) {
      info.extraInfo = {
        territories: JSON.parse(JSON.stringify(this.territories)),
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
    if (!this.gameStarted) return;

    const state = {
      territories: JSON.parse(JSON.stringify(this.territories)),
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
      "#FFA500",
      "#A020F0",
      "#00AA00",
      "#AA5500",
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

    // Reset inactivity timer on valid attack
    this.resetTurnTimer();

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
          `Attacker rolled ${this.formatDiceRoll(
            attackRoll
          )} = ${attackTotal}. ` +
          `Defender rolled ${this.formatDiceRoll(
            defenseRoll
          )} = ${defenseTotal}. ` +
          `Attack successful!`
      );

      // Check if defender is eliminated
      const wasAlive = defender && defender.alive;
      this.checkElimination(defenderId);
      if (wasAlive && defender && !defender.alive) {
        // Kill reward: grant up to 5 extra dice on the conquering territory
        const room = this.maxDicePerTerritory - toTerritory.dice;
        if (room > 0) {
          toTerritory.dice += Math.min(5, room);
        }
      }
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
          `Attacker rolled ${this.formatDiceRoll(
            attackRoll
          )} = ${attackTotal}. ` +
          `Defender rolled ${this.formatDiceRoll(
            defenseRoll
          )} = ${defenseTotal}. ` +
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

  diceToEmote(value) {
    return `:dice${value}:`;
  }

  formatDiceRoll(rolls) {
    return rolls.map((d) => this.diceToEmote(d)).join(" ");
  }

  checkElimination(playerId) {
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
    if (playerTerritories.length === 0) {
      const player = this.players.array().find((p) => p.id === playerId);
      if (player && player.alive) {
        player.kill("conquest");

        // Check if game should end
        this.checkGameEnd();
      }
    }
  }

  /**
   * Checks win conditions for Dice Wars
   * @returns {Array} [finished, winners] - Whether game is finished and Winners object
   */
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
      return { success: false, message: "Not your turn!" };
    }

    // Award reinforcement dice to the player ending their turn
    this.awardBonusDice(playerId);

    // Check if game should end before advancing turn
    if (this.checkGameEnd()) {
      return { success: true };
    }

    // Update turn order to only include alive players
    this.turnOrder = this.turnOrder.filter((id) => {
      const player = this.players.array().find((p) => p.id === id);
      return player && player.alive;
    });

    // Check again if game should end after turn order update
    if (this.checkGameEnd()) {
      return { success: true };
    }

    // Find current player's position in the updated turn order and advance
    const currentIndex = this.turnOrder.indexOf(playerId);
    this.turnIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % this.turnOrder.length;

    // Check if round is complete (wrapped back to start)
    if (this.turnIndex === 0) {
      this.roundNumber++;
    }

    this.currentTurnPlayerId = this.turnOrder[this.turnIndex];
    this.hasAttacked = false;
    this.turnNumber++;

    // Update history with new turn state
    const stateInfo = this.getStateInfo();
    this.addStateExtraInfoToHistories(stateInfo.extraInfo);

    this.sendGameState();
    this.startTurnTimer();
    const nextPlayer = this.players
      .array()
      .find((p) => p.id === this.currentTurnPlayerId);
    this.sendAlert(
      `Round ${this.roundNumber}, Turn ${this.turnNumber}: ${nextPlayer?.name}'s turn`
    );

    return { success: true };
  }

  awardBonusDice(playerId) {
    const playerTerritories = this.territories.filter(
      (t) => t.playerId === playerId
    );
    const largestRegion = this.findLargestConnectedRegion(playerId);
    let bonusDice = 3 + largestRegion.length;

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

    // Store surplus dice (max 4x the max dice limit), unless host opted to discard reserves
    const discardReserve = !!(
      this.options &&
      this.options.settings &&
      this.options.settings.discardReserveDice
    );
    if (discardReserve) {
      this.surplusDice[playerId] = 0;
    } else {
      const maxSurplus = this.maxDicePerTerritory * 4;
      this.surplusDice[playerId] = Math.min(surplusDice, maxSurplus);
    }

    if (bonusDice > 0) {
      const player = this.players.array().find((p) => p.id === playerId);
      let message = `${player.name} received ${bonusDice} bonus dice`;
      if (distributedDice < bonusDice) {
        if (discardReserve) {
          message += ` (${distributedDice} placed, ${
            bonusDice - distributedDice
          } discarded)`;
        } else {
          message += ` (${distributedDice} placed, ${this.surplusDice[playerId]} stored)`;
        }
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
    await super.playerLeave(player);

    if (this.started && !this.finished) {
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
          this.sendAlert(
            `${nextPlayer.name}'s turn (after ${player.name} left)`
          );
        }
      }

      const Action = require("./Action");
      let action = new Action({
        actor: player,
        target: player,
        game: this,
        run: function () {
          this.target.kill("leave", this.actor, true);
        },
      });

      this.instantAction(action);
      this.sendGameState();
    }
  }

  async endGame(winners) {
    await super.endGame(winners);
  }
};
