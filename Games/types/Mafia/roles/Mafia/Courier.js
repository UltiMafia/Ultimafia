const Mailman = require("../../Mailman");

module.exports = class Courier extends Mailman {
  constructor(player, data) {
    super("Courier", player, data);
  }
};
