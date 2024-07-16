const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class AppearAsRandomEvil extends Card {
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
          let roleAignment = player.role.alignment;
          if (
            roleAignment === "Mafia" ||
            roleAignment === "Cult"
          ) {
            roles.push(roleName);
          }
        }

        const roleAppearance = Random.randArrayVal(roles);
        const selfAppearance = role.name == "Miller" ? "Villager" : "real";
        this.player.holdItem("Suit", { type: roleAppearance, identity: selfAppearance, concealed: true });
      },
    };
  }
};