const Card = require("../../Card");
const Action = require("../../Action");
const {
  PRIORITY_DAY_EFFECT_DEFAULT,
  PRIORITY_WIN_CHECK_DEFAULT,
} = require("../../const/Priority");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class CultWinsIfNoCondemn extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (!this.hasAbility(["Win-Con"])) {
          return;
        }
        const enemyMayors = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p.hasEffect("MayorEffect") &&
              p.faction != this.player.faction &&
              p.hasAbility(["Win-Con", "OnlyWhenAlive"])
          );
        if (enemyMayors.length > 0 && this.canDoSpecialInteractions()) {
          return;
        }

        if (this.data.NyarlathotepWin && this.hasAbility(["Win-Con"])) {
          for (let player of this.game.players) {
            if (CULT_FACTIONS.includes(player.faction)) {
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.passiveActions = [
      {
        ability: ["Win-Con"],
        state: "Day",
        actor: role.player,
        game: role.player.game,
        priority: PRIORITY_DAY_EFFECT_DEFAULT + 1,
        labels: ["hidden", "absolute"],
        role: role,
        run: function () {
          if (!this.role.hasAbility(["Win-Con"])) return;
          let alivePlayers = this.game.players.filter((p) => p.role);

          for (let x = 0; x < alivePlayers.length; x++) {
            for (let action of this.game.actions[0]) {
              if (
                action.target == alivePlayers[x] &&
                action.hasLabel("condemn")
              ) {
                this.actor.role.data.NyarlathotepWin = false;
                return;
              }
            }
          }
          /*
            this.actor.queueAlert(
              `Now that only 3 players are alive today, Town will win if no one is executed Today!`
            );
            */
          this.actor.role.data.NyarlathotepWin = true;
          return;
        },
      },
    ];
  }
};
