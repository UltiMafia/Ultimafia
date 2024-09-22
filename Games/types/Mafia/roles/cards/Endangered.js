const Card = require("../../Card");
const { CULT_FACTIONS } = require("../../const/FactionList");

module.exports = class Endangered extends Card {
  constructor(role) {
    super(role);

    if (role.alignment == "Independent") {
      return;
    }

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        if(!CULT_FACTIONS.includes(this.player.faction)){
          return;
        }

        if (this.player.hasItem("IsTheTelevangelist")) {
          return;
        }

        this.game.queueAlert(
          `${this.player.role.name} is Endangered! Don't let them all die!`,
          0,
          this.game.players.filter(
            (p) => p.faction === this.player.faction
          )
        );
      },
      death: function (player, killer, killType, instant) {
        var aliveRoles = this.game.players.filter(
          (p) => p.alive && p.role.name == this.player.role.name
        );
        if (aliveRoles.length > 0) {
          return;
        }

        if (this.player.hasItem("IsTheTelevangelist")) {
          return;
        }

        if (this.player.role.alignment == "Cult" || this.player.faction == "Cult") {
          var devotion = this.game.players.filter(
            (p) => p.alive && p.role.data.DevotionCult
          );
          if (devotion.length > 0) {
            var backUpTarget = devotion.filter(
            (p) => p.role.data.BackUpConvert
          );
            if(backUpTarget.length > 0){
            backUpTarget.setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data,false,false,false,"No Change");
              return;
            }
            this.game.events.emit("Devotion", this.player);
            return;
          }
        }

        if(!CULT_FACTIONS.includes(this.player.faction)){
          return;
        }

        for (let p of this.game.alivePlayers()) {
          if (p.faction == this.player.faction) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
  }
};
