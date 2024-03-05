const Action = require("../../core/Action");

module.exports = class CardFishingAction extends Action {
  constructor(options) {
    super(options);
  }

  switchMoves(oldMove, newMove) {
    oldMove = oldMove || "Move";
    newMove = newMove || "Move";
    this.actor.holdItem(newMove);
    this.actor.dropItem(oldMove);
  }
};
