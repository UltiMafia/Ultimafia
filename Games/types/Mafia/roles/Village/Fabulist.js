const Role = require("../../role");

module.exports = class Fabulist extends Role {
  constructor(player, data) {
    super("Fabulist", player, data);
  }
};
