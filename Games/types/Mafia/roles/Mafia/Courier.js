const Role = require("../../role");

module.exports = class Courier extends Role {
  constructor(player, data) {
    super("Courier", player, data);
  }
};
