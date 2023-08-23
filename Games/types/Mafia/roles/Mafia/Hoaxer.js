const Mailman = require("../../Mailman");

module.exports = class Hoaxer extends Mailman {
  constructor(player, data) {
    super("Hoaxer", player, data);
  }
};
