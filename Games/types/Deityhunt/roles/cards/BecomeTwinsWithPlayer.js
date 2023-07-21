const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class BecomeTwinsWithPlayer extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      start: function () {
        let goodPlayers = this.game.players.filter(
          (p) => p.role.alignment != "Follower" 
          && p.role.alignment != "Deity");

        this.player.role.data.twin = Random.randArrayVal(goodPlayers);
        this.game.twin = [this.player.role.data.twin, this.player];

        this.player.queueAlert(`You learn that ${this.player.role.data.twin.name} is your Good Twin!`);
        this.player.role.data.twin.queueAlert(`You learn that ${this.player.name} is your Evil Twin!`);

      },
      death: function(player, killer, deathType, instant) {

        if (player != this.player.role.data.twin) return;
        if (killType !== "lynch") return;

        for (let player in this.game.players) {
          if (player.role.alignment == "Villager" ||
          player.role.alignment == "Outcast"){
            player.kill("basic", this.player)
          }
        }
      }
    };
  }
}
