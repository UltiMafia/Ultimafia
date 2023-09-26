const Role = require("../../Role");

module.exports = class RedMember extends Role {
  constructor(player, data) {
    super("Red Member", player, data);

    this.alignment = "Red";
    this.cards = ["MemberCore", "WinWithRed"];
  }
};
