const Role = require("../../Role");

module.exports = class Clone extends Role {
  constructor(player, data) {
    super("Clone", player, data);

    this.alignment = "Independent";
    this.winCount = "Village";
    this.cards = ["VillageCore","BecomeRoleInstantly"];

  }
};
