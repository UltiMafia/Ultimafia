const Card = require("../../Card");

module.exports = class TricksterReveal extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        if (this.player.hasEffect("Insanity")) return;

        for (let player of this.game.players) {
          if (player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (player.role.alignment == "Follower"
              && player != this.player){
            this.evilReveal(player, "Leader");
          }
        }
      },
      death: function (player, killer, deathType, instant) {
        if (player.role.name !== "Chainsmoker") return;
        if (player.hasEffect("Insanity")) return;

        this.data.revealEvilTonight = true;
      },
      state: function (stateInfo){
        if (!this.data.revealEvilTonight) return;
        if (!stateInfo.name.match(/Night/)) return;

        for (let player of this.game.players) {
          if (player.role.alignment == "Leader"
              && player != this.player) {
            this.evilReveal(player, "Follower");
          } 
          if (player.role.alignment == "Follower"
              && player != this.player){
            this.evilReveal(player, "Leader");
          }
        }
      }
    };
  }
};
