const Mailman = require("../../Mailman");

module.exports = class Messenger extends Mailman {
  constructor(player, data) {
    super("Messenger", player, data);
  }
};
