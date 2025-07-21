const Role = require("../../core/Role");

module.exports = class CheatRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
  }
};
