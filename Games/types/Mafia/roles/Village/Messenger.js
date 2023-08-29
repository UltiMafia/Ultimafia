const Role = require("../../role");

module.exports = class Messenger extends Role {
  constructor(player, data) {
    super("Messenger", player, data);
  }
};
