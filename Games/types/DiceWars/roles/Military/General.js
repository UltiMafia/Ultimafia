const Role = require("../../Role");

module.exports = class General extends Role {
  constructor(player, data) {
    super("General", player, data);

    this.alignment = "Military";
    this.cards = ["EndTurn", "TownCore", "WinIfLastAlive"];

    this.listeners = {
      roleAssigned: [
        function (player) {
          if (player != this.player) {
            return;
          }
        },
      ],
    };
  }
};
