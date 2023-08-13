const Lawyer = require("./Lawyer");

module.exports = class Framer extends Lawyer {
  constructor(player, data) {
    super("Framer", player, data);
  }
};
