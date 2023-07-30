const Role = require("../../Role");

module.exports = class Bomber extends Villager {
  constructor(player, data) {
    super("Bomber", player, data);
  }
};
