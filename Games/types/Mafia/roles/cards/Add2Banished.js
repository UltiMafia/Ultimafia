const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { roleEquals } = require("../../../../../lib/roleIdentity");

module.exports = class Add2Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addBanished: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        //let players = this.game.players.filter((p) => p.role.alignment == "Villager" && !p.role.reroll);
        let players = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Village" ||
              p.role.alignment == "Independent") &&
            !p.role.data.banished &&
            !p.role.data.reroll
        );
        let shuffledPlayers = Random.randomizeArray(players);
        if (shuffledPlayers.length <= 0) {
          return;
        }
        let roles = this.game.banishedRoles;
        for (let i = 0; i < 2; i++) {
          if (this.game.setup.unique) {
            let currentBanishedPlayers = this.game.players.filter(
              (p) => p.role.data.banished
            );
            const currentBanishedRoles = currentBanishedPlayers.map((p) =>
              p.role.toRoleData()
            );
            roles = roles.filter(
              (role) => !currentBanishedRoles.some((current) => roleEquals(role, current))
            );
          }
          if (roles.length <= 0) return;
          let newRole = Random.randArrayVal(roles);
          for (let item of shuffledPlayers[i].items) {
            item.drop();
          }
          shuffledPlayers[i].setRole(
            newRole,
            undefined,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
          //this.game.originalRoles[suffledPlayers[i].id] = newRole;
          const selectedIndex = roles.findIndex((role) => roleEquals(role, newRole));
          if (selectedIndex !== -1) roles.splice(selectedIndex, 1);
        }
        //this.game.excessRoles["Outcast"] = roles;
      },
    };

    //this.reroll = true;
  }
};
