const Role = require("../../Role");

module.exports = class GingerbreadMan extends Role {
  constructor(player, data) {
    super("Gingerbread Man", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore"];
  }
};
