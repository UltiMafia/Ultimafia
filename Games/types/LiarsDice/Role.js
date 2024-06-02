const Role = require("../../core/Role");

module.exports = class JottoRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
  }
};
