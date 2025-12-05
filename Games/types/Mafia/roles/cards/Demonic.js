const Card = require("../../Card");
const { CULT_FACTIONS, MAFIA_FACTIONS } = require("../../const/FactionList");

module.exports = class Demonic extends Card {
  constructor(role) {
    super(role);

     if (role.isExtraRole == true) {
      return;
    }

    this.role.data.demonic = true;

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        if (this.player.hasEffect("TelevangelistEffect")) {
          return;
        }
       
      },
      death: function (player, killer, killType, instant) {
        var aliveRoles = this.game
          .alivePlayers()
          .filter((p) => p.isDemonic(true));
        if (aliveRoles.length > 0) {
          return;
        }
        const deadEvilPoltergeist = this.game
            .deadPlayers()
            .filter(
              (p) =>
                p.role.data.CountForMajWhenDead &&
                !p.exorcised && p.isDemonic(true)
            );
        if (deadEvilPoltergeist.length > 0) {
          return;
        }

        if (this.player.hasEffect("TelevangelistEffect")) {
          return;
        }

        var devotion = this.game.players.filter(
          (p) => p.hasEffect("DevotionEffect") == true
        );
        if (devotion.length > 0) {
          var backUpTarget = devotion.filter((p) =>
            p.hasEffect("DevoteeEffect")
          );
          if (backUpTarget.length > 0) {
            backUpTarget[0].setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data,
              false,
              false,
              false,
              "No Change"
            );
            return;
          }
          this.game.events.emit("Devotion", this.player);
          return;
        }
        //this.game.queueAlert(`We Got here ${aliveRoles.length}`);
        this.game.AllDemonsDead = true;
        
        /*
        for (let p of this.game.alivePlayers()) {
          if (CULT_FACTIONS.includes(p.faction) || p.faction == "Evil") {
            p.kill("basic", this.player, instant);
          }
        }
        */
      },
    };
  }
};
