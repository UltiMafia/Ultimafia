const Card = require("../../Card");

module.exports = class LearnCondemnedRoles extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant){
        if (!this.player.alive) return;
        if (this.player == player) return;

        if (deathType == "condemn"){
          this.player.queueAlert(`:invest: You learn that ${player}'s role is ${role}.`);
        }
      }
    }
  }
};
