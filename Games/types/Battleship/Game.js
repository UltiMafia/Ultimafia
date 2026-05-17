const Game = require("../../core/Game");
const Player = require("./Player");
const Queue = require("../../core/Queue");
const Winners = require("../../core/Winners");
const Random = require("../../../lib/Random");
const boardLogic = require("./boardLogic");

const {
  GRID_SIZE,
  SHIP_SPECS,
  SHIP_TYPES,
  validateFleet: validateFleetPlacement,
  resolveFire,
} = boardLogic;

module.exports = class BattleshipGame extends Game {
  constructor(options) {
    super(options);

    this.type = "Battleship";
    this.Player = Player;
    this.states = [
      {
        name: "Postgame",
      },
      {
        name: "Pregame",
      },
      {
        name: "Place Ships",
        length: options.settings.stateLengths["Place Ships"],
        skipChecks: [() => this.allPlayersPlaced()],
      },
      {
        name: "Combat",
        length: options.settings.stateLengths["Combat"],
      },
    ];

    this.gridSize = GRID_SIZE;
    this.boards = {};
    this.turnOrder = [];
    this.currentTurnPlayerId = null;
    this.gameOverReveal = false;
  }

  start() {
    for (let player of this.players) {
      this.boards[player.id] = this.createEmptyBoardState();
    }

    super.start();
    this.sendBattleshipViews();
  }

  sendAllGameInfo(player) {
    super.sendAllGameInfo(player);
    if (!this.started) return;
    if (this.players[player.id]) {
      player.send("battleshipView", this.getViewFor(player));
    } else if (
      this.spectators.includes(player) ||
      this.spectatorsOld.includes(player)
    ) {
      player.send("battleshipView", this.getSpectatorView());
    }
  }

  createEmptyBoardState() {
    return {
      fleet: [],
      placementReady: false,
      shots: {},
    };
  }

  cellKey(row, col) {
    return `${row},${col}`;
  }

  parseCellKey(key) {
    const [row, col] = key.split(",").map(Number);
    return { row, col };
  }

  getOpponent(player) {
    return this.players.find((p) => p.id !== player.id);
  }

  allPlayersPlaced() {
    return this.players.array().every((p) => this.boards[p.id]?.placementReady);
  }

  validateFleet(ships) {
    return validateFleetPlacement(ships, this.gridSize);
  }

  placeFleet(player, ships) {
    if (this.getStateName() !== "Place Ships") {
      return "Ships can only be placed during the placement phase.";
    }

    const board = this.boards[player.id];
    if (!board) return "Invalid player.";
    if (board.placementReady) return "You have already placed your ships.";

    const error = this.validateFleet(ships);
    if (error) return error;

    board.fleet = ships.map((ship) => ({
      type: ship.type,
      cells: ship.cells.map(([r, c]) => [r, c]),
      hits: 0,
    }));
    board.placementReady = true;

    this.sendAlert(`${player.name} has placed their fleet.`);
    this.sendBattleshipViews();
    this.syncPublicExtraInfo();

    if (this.allPlayersPlaced()) {
      this.turnOrder = Random.randomizeArray(
        this.players.array().map((p) => p.id)
      );
      this.currentTurnPlayerId = this.turnOrder[0];
      const first = this.players[this.currentTurnPlayerId];
      this.sendAlert(`Combat begins! ${first?.name}'s turn.`);
      this.gotoNextState();
      this.sendBattleshipViews();
    }

    return null;
  }

  fire(player, row, col) {
    if (this.getStateName() !== "Combat") {
      return "You can only fire during combat.";
    }

    if (this.currentTurnPlayerId !== player.id) {
      return "It is not your turn.";
    }

    if (
      row < 0 ||
      row >= this.gridSize ||
      col < 0 ||
      col >= this.gridSize
    ) {
      return "Invalid coordinates.";
    }

    const board = this.boards[player.id];
    const opponent = this.getOpponent(player);
    if (!opponent) return "No opponent found.";

    const oppBoard = this.boards[opponent.id];
    const outcome = resolveFire(board, oppBoard, row, col);
    if (outcome.error) return outcome.error;

    if (outcome.sunkShip) {
      this.sendAlert(
        `${player.name} sank the enemy ${outcome.sunkShip.type}!`
      );
    } else if (outcome.result === "hit") {
      this.sendAlert(`${player.name} scored a hit!`);
    } else {
      this.sendAlert(`${player.name} missed.`);
    }

    if (outcome.won) {
      this.sendBattleshipViews();
      this.syncPublicExtraInfo();
      const winners = new Winners(this);
      winners.addPlayer(player, player.name);
      this.endGame(winners);
      return null;
    }

    const idx = this.turnOrder.indexOf(player.id);
    this.currentTurnPlayerId =
      this.turnOrder[(idx + 1) % this.turnOrder.length];
    const next = this.players[this.currentTurnPlayerId];
    if (next) this.sendAlert(`${next.name}'s turn.`);

    this.sendBattleshipViews();
    this.syncPublicExtraInfo();
    return null;
  }

  hasWon(player) {
    const opponent = this.getOpponent(player);
    if (!opponent) return false;
    const oppBoard = this.boards[opponent.id];
    return boardLogic.allShipsSunk(oppBoard.fleet);
  }

  buildOwnBoardCells(playerId, revealShips) {
    const board = this.boards[playerId];
    const opponent = this.players.array().find((p) => p.id !== playerId);
    const incoming = opponent ? this.boards[opponent.id]?.shots || {} : {};

    const cells = [];
    for (let row = 0; row < this.gridSize; row++) {
      const rowCells = [];
      for (let col = 0; col < this.gridSize; col++) {
        const key = this.cellKey(row, col);
        let status = "water";
        let shipType = null;

        if (revealShips || this.getStateName() === "Place Ships") {
          for (const ship of board.fleet) {
            if (ship.cells.some(([r, c]) => r === row && c === col)) {
              status = "ship";
              shipType = ship.type;
              break;
            }
          }
        }

        if (incoming[key]) {
          status = incoming[key].result;
        } else if (status === "ship" && this.getStateName() === "Combat") {
          status = "ship";
        }

        rowCells.push({ status, shipType });
      }
      cells.push(rowCells);
    }
    return cells;
  }

  buildEnemyBoardCells(playerId) {
    const board = this.boards[playerId];
    const opponent = this.players.array().find((p) => p.id !== playerId);
    const oppFleet = opponent ? this.boards[opponent.id]?.fleet || [] : [];
    const revealAll =
      this.gameOverReveal || this.finished;

    const cells = [];
    for (let row = 0; row < this.gridSize; row++) {
      const rowCells = [];
      for (let col = 0; col < this.gridSize; col++) {
        const key = this.cellKey(row, col);
        const shot = board.shots[key];
        let status = "unknown";
        let shipType = null;

        if (shot) {
          status = shot.result;
        } else if (revealAll) {
          for (const ship of oppFleet) {
            if (ship.cells.some(([r, c]) => r === row && c === col)) {
              status = "ship";
              shipType = ship.type;
              break;
            }
          }
          if (status === "unknown") status = "water";
        }

        rowCells.push({ status, shipType });
      }
      cells.push(rowCells);
    }
    return cells;
  }

  getViewFor(recipient) {
    const isSpectator =
      recipient &&
      !this.players[recipient.id] &&
      (this.spectators.includes(recipient) ||
        this.spectatorsOld.includes(recipient));

    if (isSpectator || !recipient) {
      return this.getSpectatorView();
    }

    const player = this.players[recipient.id];
    if (!player) return this.getSpectatorView();

    const opponent = this.getOpponent(player);
    const myBoard = this.boards[player.id];
    const oppBoard = opponent ? this.boards[opponent.id] : null;

    return {
      phase: this.getStateName(),
      gridSize: this.gridSize,
      myPlayerId: player.id,
      opponentId: opponent?.id || null,
      opponentName: opponent?.name || null,
      currentTurnPlayerId: this.currentTurnPlayerId,
      myPlacementReady: myBoard?.placementReady || false,
      opponentPlacementReady: oppBoard?.placementReady || false,
      isMyTurn: this.currentTurnPlayerId === player.id,
      ownBoard: this.buildOwnBoardCells(player.id, true),
      enemyBoard: this.buildEnemyBoardCells(player.id),
      shipTypes: SHIP_TYPES,
      shipSpecs: SHIP_SPECS,
      gameOverReveal: this.gameOverReveal || this.finished,
    };
  }

  getSpectatorView() {
    const players = this.players.array();
    const views = players.map((p) => ({
      playerId: p.id,
      playerName: p.name,
      ownBoard: this.buildOwnBoardCells(p.id, true),
      enemyBoard: this.buildEnemyBoardCells(p.id),
      placementReady: this.boards[p.id]?.placementReady || false,
    }));

    return {
      phase: this.getStateName(),
      gridSize: this.gridSize,
      spectator: true,
      currentTurnPlayerId: this.currentTurnPlayerId,
      players: views,
      shipTypes: SHIP_TYPES,
      shipSpecs: SHIP_SPECS,
      gameOverReveal: this.gameOverReveal || this.finished,
    };
  }

  sendBattleshipViews() {
    for (let player of this.players) {
      if (player.send) {
        player.send("battleshipView", this.getViewFor(player));
      }
    }

    const spectatorView = this.getSpectatorView();
    for (let spectator of this.spectators) {
      if (spectator.send) spectator.send("battleshipView", spectatorView);
    }
    for (let spectator of this.spectatorsOld) {
      if (spectator.send) spectator.send("battleshipView", spectatorView);
    }
  }

  getPublicExtraInfo() {
    return {
      phase: this.getStateName(),
      gridSize: this.gridSize,
      currentTurnPlayerId: this.currentTurnPlayerId,
      placementReady: this.players.array().map((p) => ({
        playerId: p.id,
        playerName: p.name,
        ready: this.boards[p.id]?.placementReady || false,
      })),
      gameOverReveal: this.gameOverReveal || this.finished,
    };
  }

  syncPublicExtraInfo() {
    const extraInfo = this.getPublicExtraInfo();
    this.addStateExtraInfoToHistories(extraInfo);
    this.broadcast("battleshipPublic", extraInfo);
  }

  addStateExtraInfoToHistories(extraInfo, state) {
    const publicInfo = extraInfo || this.getPublicExtraInfo();
    this.history.addStateExtraInfo(publicInfo, state);
    this.spectatorHistory.addStateExtraInfo(
      { ...publicInfo, spectatorBoards: this.getSpectatorView().players },
      state
    );

    for (let player of this.players) {
      player.addStateExtraInfoToHistory(this.getViewFor(player), state);
    }
  }

  getStateInfo(state) {
    const info = super.getStateInfo(state);
    info.extraInfo = this.getPublicExtraInfo();
    return info;
  }

  async playerLeave(player) {
    await super.playerLeave(player);

    if (this.started && !this.finished) {
      this.sendAlert("The game cannot continue as a player has left.");
      this.immediateEnd();
    }
  }

  checkWinConditions() {
    let finished = false;
    const winQueue = new Queue();
    const winners = new Winners(this);
    const aliveCount = this.alivePlayers().length;

    for (let player of this.players) {
      winQueue.enqueue(player.role.winCheck);
    }

    for (let winCheck of winQueue) {
      winCheck.check(aliveCount, winners, aliveCount);
    }

    if (winners.groupAmt() > 0) finished = true;
    else if (aliveCount === 0) {
      winners.addGroup("No one");
      finished = true;
    }

    winners.determinePlayers();
    return [finished, winners];
  }

  endGame(winners) {
    this.gameOverReveal = true;
    super.endGame(winners);
    this.sendBattleshipViews();
  }
};

Object.assign(module.exports, boardLogic);
