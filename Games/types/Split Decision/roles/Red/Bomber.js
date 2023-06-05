const Role = require("../../Role");

module.exports = class Bomber extends Role {
  constructor(player, data) {
    super("Bomber", player, data);

    this.alignment = "Red";
    this.cards = ["MemberCore", "WinWithRed"];
  }
};
