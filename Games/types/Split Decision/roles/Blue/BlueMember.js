const Role = require("../../Role");

module.exports = class BlueMember extends Role {
  constructor(player, data) {
    super("Blue Member", player, data);

    this.alignment = "Blue";
    this.cards = ["MemberCore", "WinWithBlue"];
  }
};
