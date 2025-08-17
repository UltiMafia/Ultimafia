const Card = require("../../Card");
const {
  PRIORITY_DAY_EFFECT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class LoseIfSeerGuessed extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        // win by guessing seer
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );

        if (!this.game.guessedSeers) {
          this.game.guessedSeers = {};
        }

        for (let faction of EVIL_FACTIONS) {
          if (!this.game.guessedSeers[faction]) {
            this.game.guessedSeers[faction] = [];
          }
          if (
            seersInGame.length > 0 &&
            seersInGame.length == this.game.guessedSeers[faction].length
          ) {
            for (let player of this.game.players) {
              if (faction == player.faction) {
                winners.addPlayer(player, player.faction);
              }
            }
          }
        }
      },
    };
  }
};
