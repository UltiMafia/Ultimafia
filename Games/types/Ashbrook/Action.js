const Action = require("../../core/Action");
const Random = require("../../../lib/Random");
const Player = require("../../core/Player");

module.exports = class AshbrookAction extends Action {
  constructor(options) {
    super(options);
  }

  leaderProtect(target) {
    target = target || this.target;

    target.setTempImmunity("leader", 5);
  }

  getAliveNeighbors(player) {
    player = player || this.actor

    let alive = this.game.alivePlayers();
    let index = alive.indexOf(player);

    const leftIdx = (index - 1 + alive.length) % alive.length;
    const rightIdx = (index + 1) % alive.length;
    return [alive[leftIdx], alive[rightIdx]];
  }

  blockActions(target) {
    target = target || this.target;

    for (let action of this.game.actions[0]) {
      if (action.priority > this.priority && !action.hasLabel("absolute")) {
        action.cancelActor(target);
      }
    }
  }

  isInsane(target) {
    target = target || this.actor;

    return target.hasEffect("Insanity");
  }
}