const Role = require("../../Role");

module.exports = class Secretary extends Role {
  constructor(player, data) {
    super("Secretary", player, data);

    this.alignment = "Outcast";
    this.cards = [
      "VillageCore",
      "WinWithGood",
      "DisableVotingIfDeadAtNight",
    ];
  }
};
