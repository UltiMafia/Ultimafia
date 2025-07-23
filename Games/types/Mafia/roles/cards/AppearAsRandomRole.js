const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }

        let roles = [];

        for (let player of this.game.players) {
          let roleName = player.role.name;
          if (
            roleName != "Villager" &&
            roleName != "Imposter" &&
            roleName != "Impersonator" &&
            roleName != "Skinwalker"
          ) {
            roles.push(roleName);
          }
        }

        const roleAppearance = Random.randArrayVal(roles);
        this.player.holdItem("Suit", { type: roleAppearance, concealed: true });
        this.player.queueAlert(roleAppearance);
      },
    };
  }
};
