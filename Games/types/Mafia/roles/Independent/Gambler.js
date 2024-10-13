const Role = require("../../Role");

module.exports = class Gambler extends Role {
  constructor(player, data) {
    super("Gambler", player, data);

    this.alignment = "Independent";
    this.cards = ["VillageCore", "ChallengeTarget", "WinWithTwoGambleWins"];

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        this.player.queueAlert(
          ":dice6: Everything this Village does is based on chance. Show them the odds and prove that the house doesn't always win."
        );
      },
    };
  }
};
