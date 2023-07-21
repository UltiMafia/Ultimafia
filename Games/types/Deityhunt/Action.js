const Action = require("../../core/Action");
const Random = require("../../../lib/Random");
const Player = require("../../core/Player");

module.exports = class DeityhuntAction extends Action {
  constructor(options) {
    super(options);
  }

  deityProtect(target) {
    target = target || this.target;

    target.setTempImmunity("deity", 5);
  }

  getAliveNeighbors() {
    let alive = this.game.alivePlayers();
    let index = alive.indexOf(this.actor);

    const leftIdx = (index - 1 + alive.length) % alive.length;
    const rightIdx = (index + 1) % alive.length;
    return [alive[leftIdx], alive[rightIdx]];
  }
}