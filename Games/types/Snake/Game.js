const Game = require("../../core/Game");
const Winners = require("../../core/Winners");
const Player = require("./Player");

/**
 * The backend state and logic handler for a multiplayer Snake game.
 */
module.exports = class SnakeGame extends Game {
  /**
   * @param {object} options - Game initialization options
   */
  constructor(options) {
    super(options);

    console.log(options);
    
    this.type = "Snake";
    this.Player = Player;
    this.gridSize = options.boardSize || 20;
    this.gameStarted = false;
    this.states = [
      { name: "Postgame" },
      { name: "Pregame" },
      {
        name: "Day",
        length: options.settings.stateLengths["Day"] ?? 60,
      },
    ];

    console.log(options, this);

    /**
     * @type {Record<string, { direction: string, segments: Array<{x: number, y: number}>, alive: boolean }>}
     */
    this.positions = {};

    // Run game tick
    this.tickInterval = setInterval(() => {
      this.gameTick();
    }, 1000);
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
   * Spawns food at a random position not occupied by any snake.
   * @returns {{x: number, y: number}}
   */
  spawnFood() {
    let pos;
    do {
      pos = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize),
      };
    } while (Object.values(this.positions).some(p =>
      p.segments.some(seg => seg.x === pos.x && seg.y === pos.y))
    );
    return pos;
  }

  startGame() {
    this.gameStarted = true;
    
    this.positions = {};

    // Initialize snake positions for each player
    for (const player of this.players) {
      this.positions[player.id] = {
        direction: "up",
        segments: [this.getRandomStartSegment()],
        alive: true,
      };
    }

    // Set up food spawn
    this.food = this.spawnFood();

    console.log(this.gameStarted, this.players, this.positions);
  }
  /**
   * The main game loop tick: moves all snakes, checks collisions, awards points, etc.
   */
  gameTick() {
    if (this.getStateName() !== 'Day'){
      return;
    }
    if (!this.gameStarted){
      this.startGame()
    }
    // Move each snake if alive
    for (const [playerId, snake] of Object.entries(this.positions)) {
      if (!snake.alive) continue;
      const head = { ...snake.segments[0] };
      switch (snake.direction) {
        case "up": head.y -= 1; break;
        case "down": head.y += 1; break;
        case "left": head.x -= 1; break;
        case "right": head.x += 1; break;
      }

      // Check wall collisions (using gridSize)
      if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
        snake.alive = false;
        continue;
      }

      // Check self collisions
      if (snake.segments.some(seg => seg.x === head.x && seg.y === head.y)) {
        snake.alive = false;
        continue;
      }

      // Check collision with other snakes
      for (const [otherId, otherSnake] of Object.entries(this.positions)) {
        if (otherId !== playerId && otherSnake.alive &&
            otherSnake.segments.some(seg => seg.x === head.x && seg.y === head.y)) {
          snake.alive = false;
          break;
        }
      }
      if (!snake.alive) continue;

      // Move snake
      snake.segments.unshift(head);

      // Check food collection
      if (head.x === this.food.x && head.y === this.food.y) {
        this.food = this.spawnFood();
        // Optionally notify player or award points
      } else {
        // Remove tail if not eating
        snake.segments.pop();
      }
    }

    // Broadcast updated state to players
    this.broadcast("gameState", {
      snakes: this.positions,
      food: this.food
    });

    // Check for win condition: only one snake left alive, or all dead
    const alivePlayers = Object.keys(this.positions).filter(pid => this.positions[pid].alive);

    if (alivePlayers.length <= 1) {
      clearInterval(this.tickInterval);
      const winners = new Winners()
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
      this.positions[player.id].alive = false;
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
      right: "left"
    };
    if (direction !== opposite[snake.direction]) {
      snake.direction = direction;
    }
  }
};