const Role = require("../../core/Role");

module.exports = class RatscrewRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
    // Ratscrew has a single role; the engine's "X's role is Player." reveal
    // alert on elimination is just noise. Clearing reveal-appearance makes
    // Role.revealToAll early-return for any kill type.
    this.appearance.reveal = "";
    this.appearanceMods.reveal = "";
  }
};
