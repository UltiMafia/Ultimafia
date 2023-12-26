const Action = require("../../core/Action");

module.exports = class CrazyEightsAction extends Action {
  constructor(options) {
    super(options);
  }

  flipBoolean(boolean) {
    if (boolean == true) {
      return false;
    } else {
      return true;
    }
  }

  getNextPlayer(player) {
    player = player || this.actor;
    let alive = this.game.alivePlayers();
    let index = alive.indexOf(player);
    let nextPlayer = alive[(index + 1) % alive.length];
    if (this.game.reverse) {
      nextPlayer = alive[(index - 1) % alive.length];
    }
    return nextPlayer;
  }

  passMoveToNextPlayer(item) {
    item = item || "Move";
    let nextPlayer = this.getNextPlayer();
    nextPlayer.holdItem("Move");
    this.actor.dropItem(item);
  }

  passMoveToPlayerAfterNext(item) {
    item = item || "Move";
    let nextPlayer = this.getNextPlayer();
    let playerAfterNext = this.getNextPlayer(nextPlayer);
    playerAfterNext.holdItem("Move");
    this.actor.dropItem(item);
  }

  passMoveToNextPlayerDraw2(item) {
    item = item || "Move";
    let nextPlayer = this.getNextPlayer();
    this.game.draw2 = true;
    nextPlayer.holdItem("Move");
    this.actor.dropItem(item);
  }
};