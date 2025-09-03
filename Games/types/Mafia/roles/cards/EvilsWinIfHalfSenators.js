const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const { EVIL_FACTIONS } = require("../../const/FactionList");

module.exports = class EvilsWinIfHalfSenators extends Card {
  constructor(role) {
    super(role);

    this.winCheckSpecial = {
      priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        //let senators = this.game.players.filter((p) => p.role.name == "Senator");
        //let aliveSenators = this.game.alivePlayers().filter((p) => p.role.name == "Senator");
        var hasSenators = false;
        var senatorCount = 0;
        var senAliveCount = 0;
        if (!this.player.hasEffect("SenatorEffect")) {
          return;
        }
        for (let p of this.game.players) {
          if (p.hasEffect("SenatorEffect")) {
            hasSenators = true;
            senatorCount++;
            senAliveCount += p.alive ? 1 : 0;
          }
        }

        if (
          hasSenators &&
          senAliveCount < Math.ceil(senatorCount * 0.5 + 0.01)
        ) {
          for (let player of this.game.players) {
            if (EVIL_FACTIONS.includes(player.faction)) {
              winners.addPlayer(player, player.faction);
            }
          }
        }
      },
    };

    this.listeners = {
      AbilityToggle: function (player) {
        if (!this.player.alive) {
          return;
        }
        let checks = true;
        if (!this.hasAbility(["Win-Con", "WhenDead"])) {
          checks = false;
        }

        if (checks == true) {
          if (
            this.SenateEffect == null ||
            !this.player.effects.includes(this.SenateEffect)
          ) {
            this.SenateEffect = this.player.giveEffect(
              "SenatorEffect",
              Infinity
            );
            this.passiveEffects.push(this.SenateEffect);
          }
        } else {
          var index = this.passiveEffects.indexOf(this.SenateEffect);
          if (index != -1) {
            this.passiveEffects.splice(index, 1);
          }
          if (this.SenateEffect != null) {
            this.SenateEffect.remove();
            this.SenateEffect = null;
          }
        }
      },
    };
  }
};
