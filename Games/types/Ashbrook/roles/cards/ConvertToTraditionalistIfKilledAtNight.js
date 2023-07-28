const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ConvertToTraditionnalistIfKilledAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        if (this.game.getStateName() != "Night") return;
        if (this.player.hasEffect("Insanity")) return;

        let alive = this.game.players.filter((p) => p.alive);
        let good = alive.filter((p) => 
        (p.role.alignment === "Villager" || 
        p.role.alignment === "Outcast"))

        var traditionalist = Random.randArrayVal(good);
        if (traditionalist) traditionalist.setRole("Traditionalist");

      }
    };
  }
}
