const Card = require("../../Card");
const { PRIORITY_DAY_EFFECT_DEFAULT } = require("../../const/Priority");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { CULT_FACTIONS, EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class VillageWinsWhenKilled extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (this.killedAssassin) {
          for (let player of this.game.players) {
            if (player.faction == "Village") {
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.listeners = {
      death: function (player, killer, deathType) {
        if (player.hasEffect("PresidentEffect")) {
          this.killedPresident = true;
        }

        if (player != this.player) {
          return;
        }

        if (this.killedPresident == true) {
          return;
        }

        if (this.game.FinalRound < this.game.CurrentRound) {
          this.killedAssassin = true;
          return;
        }

        let otherAssassins = this.game
          .alivePlayers()
          .filter(
            (p) =>
              p != this.player &&
              ((p.hasEffect("PresidentEffect") &&
                p.hasAbility(["Win-Con", "WhenDead"])) ||
                p.role.data.RoleTargetBackup == "Assassin")
          );
        if (otherAssassins.length > 0) {
          return;
        }

        this.killedAssassin = true;
      },
      AbilityToggle: function (player) {
        if (!this.player.alive) {
          return;
        }
        let checks = true;
        for (let player of this.game.alivePlayers()) {
          for (let effect of player.effects) {
            if (effect.name == "BackUp") {
              if (
                effect.BackupRole &&
                `${effect.BackupRole}` === `${this.name}` &&
                effect.CurrentRole.hasAbility([
                  "Convert",
                  "OnlyWhenAlive",
                  "Modifier",
                ])
              ) {
                checks = false;
              }
            }
          }
        }
        if (this.game.FinalRound < this.game.CurrentRound) {
          checks = true;
        }
        if (!this.hasAbility(["Win-Con", "WhenDead"])) {
          checks = false;
        }

        if (checks == true) {
          if (
            this.AssassinEffect == null ||
            !this.player.effects.includes(this.AssassinEffect)
          ) {
            this.AssassinEffect = this.player.giveEffect(
              "AssassinEffect",
              Infinity
            );
            this.passiveEffects.push(this.AssassinEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.AssassinEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.AssassinEffect != null) {
            this.AssassinEffect.remove();
            this.AssassinEffect = null;
          }
        }
      },
    };
  }
};
