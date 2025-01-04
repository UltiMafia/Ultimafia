const Role = require("../../Role");

module.exports = class Snoop extends Role {
  constructor(player, data) {
    super("Snoop", player, data);

    this.alignment = "Liars";
    this.cards = ["TownCore", "WinIfLastAlive"];
    this.startItems = [
      {
        type: "Snooping",
      },
    ];
  }
};
