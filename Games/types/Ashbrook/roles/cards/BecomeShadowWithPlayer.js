const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeShadowWithPlayer extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let goodPlayers = this.game.players.filter(
          (p) => p.role.alignment != "Follower" 
          && p.role.alignment != "Leader");

        this.player.role.data.shadow = Random.randArrayVal(goodPlayers);
        this.game.shadow = [this.player.role.data.shadow, this.player];

        this.player.queueAlert(`You learn that ${this.player.role.data.shadow.name} is your Good Shadow!`);
        this.player.role.data.shadow.queueAlert(`You learn that ${this.player.name} is your Evil Shadow!`);

        if (this.player.hasEffect("Insanity")){
          delete this.player.role.data.shadow;
        }

      },
      death: function(player, killer, deathType, instant) {
        if (!this.player.role.data.shadow) return;
        if (player != this.player.role.data.shadow) return;
        if (deathType !== "condemn") return;

        this.game.evilWin = true;
        this.game.queueAlert(`${player.name} was the Good Shadow!`);
      }
    };
  }
}
