const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class StyleContest extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      AbilityToggle: function (player) {
        if (this.player.hasAbility(["WhenDead"])) {
          for (let player of this.game.players) {
            if (player.faction == this.player.faction) {
              if (!player.hasEffect("StylePoints")) {
                let effect = player.giveEffect(
                  "StylePoints",
                  this.player,
                  player
                );
                this.player.passiveEffects.push(effect);
              }
            }
          }
        }
      },
      handleWinWith: function (winners) {
        if (!this.player.hasAbility(["Win-Con", "WhenDead"])) {
          return;
        }
        let stylePlayers = [];
        let highScore = 1;
        for (let player of this.game.players) {
          if (player.data.StylePoints == highScore) {
            stylePlayers.push(player);
          } else if (player.data.StylePoints > highScore) {
            stylePlayers = [];
            highScore = player.data.StylePoints;
          }
        }
        if (stylePlayers.length == 1) {
          winners.addPlayer(stylePlayers[0], "Style Points");
        }
      },
    };
  }
};
