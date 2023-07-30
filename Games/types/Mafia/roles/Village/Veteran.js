const Role = require("../../Role");

module.exports = class Veteran extends Villager {
  constructor(player, data) {
    super("Veteran", player, data);

  }
};
