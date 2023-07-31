const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class RoleModifyAdd2Outcast extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      reroll: function (player) {
        if (player != this.player) return;

        let players = this.game.players.filter((p) => p.role.alignment == "Villager" && !p.role.reroll);
        let shuffledPlayers = Random.randomizeArray(players);
        let roles = this.game.excessRoles["Outcast"];
        for (let i = 0; i < 2; i++){
          this.game.excessRoles["Villager"].push(shuffledPlayers[i].role.name);
          let newRole = Random.randArrayVal(roles);
          shuffledPlayers[i].setRole(newRole, undefined, false, true);
          roles.slice(roles.indexOf(newRole), 1);
        }
        this.game.excessRoles["Outcast"] = roles;
      },
    };
  }
};
