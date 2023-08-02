const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class RoleModifyAddOrRemove1Outcast extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      reroll: function (player) {
        if (player != this.player) return;
        if (this.player.hasEffect("Insanity")) return;

        let change = Random.randArrayVal(["add", "remove"]);

        if (change == "add"){
          let players = this.game.players.filter((p) => p.role.alignment == "Villager" && !p.role.reroll);
          let shuffledPlayer = Random.randArrayVal(players);
          let roles = this.game.excessRoles["Outcast"];
          this.game.excessRoles["Villager"].push(shuffledPlayer.role.name);
          //this.game.rollQueue.push(shuffledPlayer.name);
          let newRole = Random.randArrayVal(roles);
          shuffledPlayer.setRole(newRole, undefined, false, true);
          roles.slice(roles.indexOf(newRole), 1);
          this.game.excessRoles["Outcast"] = roles;
        } else {
          let players = this.game.players.filter((p) => p.role.alignment == "Outcast" && !p.role.reroll);
          let shuffledPlayer = Random.randArrayVal(players);
          let roles = this.game.excessRoles["Villager"];
          this.game.excessRoles["Outcast"].push(shuffledPlayer.role.name);
          //this.game.rollQueue.push(shuffledPlayer.name);
          let newRole = Random.randArrayVal(roles);
          shuffledPlayer.setRole(newRole, undefined, false, true);
          roles.slice(roles.indexOf(newRole), 1);
          this.game.excessRoles["Villager"] = roles;
        }
      },
    };

    this.reroll = true;
  }
};
