const Card = require("../../Card");
const Action = require("../../Action");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class StyleContest extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.hasAbility(["Win-Con", "WhenDead"])) {
          return;
        }
        let stylePlayers = [];
        let highScore = 1;
        for (let player of this.game.players) {
          if (player.data.StylePoints == highScore) {
            stylePlayers.push(player);
          } else if (player.data.StylePoints > highScore) {
            stylePlayers = [];
            stylePlayers.push(player);
            highScore = player.data.StylePoints;
          }
        }
        if (
          confirmedFinished &&
          stylePlayers.length == 1 &&
          !Object.values(winners.groups)
            .flat()
            .find((p) => p === stylePlayers[0])
        ) {
          winners.addPlayer(stylePlayers[0], "Style Points");
        }
      },
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (this.hasAbility(["WhenDead"])) {
          for (let player of this.game.players) {
            if (player.faction == this.player.faction) {
              if (!player.hasEffect("StylePoints")) {
                let effect = player.giveEffect(
                  "StylePoints",
                  this.player,
                  player
                );
                this.passiveEffects.push(effect);
              }
            }
          }
        }
      },
      state: function () {
        if (this.game.getStateName() == "Day") {
          let contest = [];
          for (let player of this.game.players) {
            if (player.data.StylePoints > 0) {
              contest.push(player);
            }
          }
          for (let member of contest) {
            this.game.queueAlert(
              `${member.name} has ${member.data.StylePoints} Style Points!`,
              0,
              this.game.players.filter(
                (p) => p.role.alignment === this.player.role.alignment
              )
            );
          }
        }
      },
    };
  }
};
