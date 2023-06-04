const Role = require("../../Role");

module.exports = class President extends Role {
  constructor(player, data) {
    super("President", player, data);

    this.alignment = "Blue";
    this.cards = ["MemberCore", "WinWithBlue"];
  }
};
