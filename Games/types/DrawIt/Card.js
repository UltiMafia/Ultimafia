// Engine pass-through; no DrawIt-specific behavior. Required to satisfy the
// engine's per-game-type class-loading pattern (Utils.importGameClass).
const Card = require("../../core/Card");

module.exports = class DrawItCard extends Card {
  constructor(role) {
    super(role);
  }
};
