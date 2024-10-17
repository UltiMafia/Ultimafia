const Role = require("../../Role");

module.exports = class Tourist extends Role {
  constructor(player, data) {
    super("Tourist", player, data);

    this.alignment = "Village";
    this.cards = [
      "VillageCore",
      "WinWithFaction",
      "MeetingFaction",
      "Expose1to3ExcessRoles",
    ];
  }
};
