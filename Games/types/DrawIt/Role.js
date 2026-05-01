// Engine pass-through; no DrawIt-specific behavior yet. Required to satisfy
// the engine's per-game-type class-loading pattern (Utils.importGameClass).
const Role = require("../../core/Role");

module.exports = class DrawItRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
  }
};
