const Card = require("../../Card");

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

        this.game.queueAlert(
          `${this.player.role.name} is Endangered! Don't let them all die!`,
          0,
          this.game.players.filter(
            (p) => p.role.alignment === this.player.role.alignment
          )
        );
      },
      death: function (player, killer, killType, instant) {
        
        
        var aliveRoles = this.game.players.filter((p) => p.alive && p.role.name == this.player.role.name);
          if(aliveRoles.length > 0){
            return;
          }
        
        if(this.player.role.alignment == "Cult"){
        var devotion = this.game.players.filter((p) => p.alive && p.role.name == "Devotee");
          if(devotion.length > 0){
            var backUpTarget = devotion [0];
            backUpTarget.setRole(
              `${this.player.role.name}:${this.player.role.modifier}`,
              this.player.role.data
            );
            return;
          }
        }

        for (let p of this.game.alivePlayers()) {
          if (p.role.alignment === this.player.role.alignment) {
            p.kill("basic", this.player, instant);
          }
        }
      },
    };
    
  }
};
