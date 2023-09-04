const Role = require("../../core/Role");

module.exports = class SecretDictatorRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);
  }
};
