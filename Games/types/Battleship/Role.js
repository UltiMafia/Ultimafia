const Role = require("../../core/Role");

module.exports = class BattleshipRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
  }
};
