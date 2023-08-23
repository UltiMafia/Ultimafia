const Mailman = require("../../Mailman");

module.exports = class Fabulist extends Mailman {
  constructor(player, data) {
    super("Fabulist", player, data);
  }
};
