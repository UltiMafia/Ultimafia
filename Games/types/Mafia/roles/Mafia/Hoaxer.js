const Role = require("../../role");

module.exports = class Hoaxer extends Role {
  constructor(player, data) {
    super("Hoaxer", player, data);
  }
};
