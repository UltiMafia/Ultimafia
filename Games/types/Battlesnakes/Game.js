const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

/**
 * The backend state and logic handler for a multiplayer Battlesnakes game.
 */
module.exports = class BattlesnakesGame extends Game {
  /**
   * @param {object} options - Game initialization options
   */
  constructor(options) {
    super(options);

    this.type = "Battlesnakes";
    this.Player = Player;
    this.gridSize = parseInt(options.settings.boardSize) || 20;
    this.gameStarted = false;
    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"] ?? 60,
      },
    ];

    /**
     * @type {Record<string, { direction: string, segments: Array<{x: number, y: number}>, alive: boolean }>}
     */
    this.positions = {};

    /**
     * @type {Array<{x: number, y: number}>}
     */
    this.foods = [];
  }

  incrementState() {
    super.incrementState();

    const state = this.getStateInfo().name;
    if (state === "Day") {
      this.startGame();

      // Run game tick
      this.tickInterval = setInterval(() => {
        this.gameTick();
      }, 250);
    }
  }

  /**
   * Returns a random starting position for a snake.
   * @returns {{x: number, y: number}}
   */
  getRandomStartSegment() {
    return {
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    };
  }

  /**
   * Spawns and adds food at a random position not occupied by any snake or other food.
   * @returns {{x: number, y: number}}
   */
  spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize),
      };
    } while (
      Object.values(this.positions).some((p) =>
        p.segments.some((seg) => seg.x === pos.x && seg.y === pos.y)
      ) ||
      this.foods.some((food) => food.x === pos.x && food.y === pos.y)
    );
    this.foods.push(pos);
    return pos;
  }

  startGame() {
    this.gameStarted = true;

    this.positions = {};

    // Initialize snake positions for each player
    for (const player of this.players) {
      if (player.role.name != "Host") {
        this.positions[player.id] = {
          playerId: player.id,
          direction: "up",
          segments: [this.getRandomStartSegment()],
          alive: true,
        };
      }
    }

    // Spawn multiple foods (e.g., 3, adjust as needed)
    this.foods = [];
    for (let i = 0; i < 3; i++) {
      this.spawnFood();
    }
  }

  killSnake(snake) {
    snake.alive = false;
    this.players[snake.playerId]?.kill();
  }

  /**
   * The main game loop tick: moves all snakes, checks collisions, awards points, etc.
   */
  gameTick() {
    // Move each snake if alive
    for (const [playerId, snake] of Object.entries(this.positions)) {
      snake.directionChanged = false; // this flag prevents the so-called "turn bug"

      if (!snake.alive) continue;
      const head = { ...snake.segments[0] };
      switch (snake.direction) {
        case "up":
          head.y -= 1;
          break;
        case "down":
          head.y += 1;
          break;
        case "left":
          head.x -= 1;
          break;
        case "right":
          head.x += 1;
          break;
      }

      // New: Wrap the head position at the walls
      head.x = (head.x + this.gridSize) % this.gridSize;
      head.y = (head.y + this.gridSize) % this.gridSize;

      // Remove wall collision check, only check for self/other snake collisions
      // Check self collisions
      if (snake.segments.some((seg) => seg.x === head.x && seg.y === head.y)) {
        this.killSnake(snake);
        continue;
      }

      // Check collision with other snakes
      for (const [otherId, otherSnake] of Object.entries(this.positions)) {
        if (
          otherId !== playerId &&
          otherSnake.alive &&
          otherSnake.segments.some(
            (seg) => seg.x === head.x && seg.y === head.y
          )
        ) {
          this.killSnake(snake);
          break;
        }
      }
      if (!snake.alive) continue;

      // Move snake
      snake.segments.unshift(head);

      // Food collection logic for multiple foods
      let ateFoodIndex = this.foods.findIndex(
        (f) => f.x === head.x && f.y === head.y
      );
      if (ateFoodIndex !== -1) {
        // Remove eaten food and spawn a new one
        this.foods.splice(ateFoodIndex, 1);
        this.spawnFood();
      } else {
        // Remove tail if not eating
        snake.segments.pop();
      }
    }

    // Broadcast updated state to players
    this.broadcast("gameState", {
      snakes: this.positions,
      foods: this.foods,
      gridSize: this.gridSize,
    });

    // Check for win condition: only one snake left alive, or all dead
    const alivePlayers = Object.keys(this.positions).filter(
      (pid) => this.positions[pid].alive
    );

    if (alivePlayers.length <= 1) {
      clearInterval(this.tickInterval);
      const winners = new Winners();
      const winner = this.players[alivePlayers[0]];
      // if (winner){
      //   winners.addPlayer(winner, 'snakes')
      // }
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
    if (this.positions[player.id]) {
      this.killSnake(this.positions[player.id]);
    }
    await super.playerLeave(player);
  }

  /**
   * Ends the game with the given winners.
   * @param {string[]} winners
   */
  async endGame(winners) {
    clearInterval(this.tickInterval);
    await super.endGame(winners);
  }

  /**
   * Handles direction change requests from players.
   * @param {string} playerId
   * @param {"up" | "down" | "left" | "right"} direction
   */
  setDirection(playerId, direction) {
    const snake = this.positions[playerId];
    if (!snake || !snake.alive) return;

    const opposite = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };

    if (
      direction !== opposite[snake.direction] &&
      direction !== snake.direction &&
      snake.directionChanged === false
    ) {
      snake.direction = direction;
      snake.directionChanged = true;
    }
  }
};
