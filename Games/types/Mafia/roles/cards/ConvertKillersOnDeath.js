const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ConvertKillersOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      death: function (player, killer, deathType, instant) {
        if (player === this.player && deathType !== "condemn" && killer) {
          if (Random.randArrayVal([true, false])) {
            killer.queueAlert(
              ":sy2a: You regret what you have done... You want to change your ways..."
            );
            switch (killer.role.alignment) {
              case "Mafia":
                killer.setRole("Traitor");
                break;
              case "Village":
                killer.setRole("Villager");
                break;
              case "Cult":
                killer.setRole("Occultist");
                break;
              case "Independent":
                killer.setRole("Survivor");
                break;
            }
          }
        }
      },
    };
  }
};
