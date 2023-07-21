const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ConvertToVillager7IfKilledAtNight extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, killType, instant) {
        if (player !== this.player) {
          return;
        }
        
        if (this.game.getStateName() != "Night") return;

        let alive = this.game.players.filter((p) => p.alive);
        let good = alive.filter((p) => 
        (p.role.alignment === "Villager" || 
        p.role.alignment === "Outcast"))

        var newVillager7 = Random.randArrayVal(good);
        if (newVillager7) newVillager7.setRole("Villager7");

      }
    };
  }
}
