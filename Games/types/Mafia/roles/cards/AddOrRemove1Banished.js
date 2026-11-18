const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { roleEquals, roleName, roleModifiers } = require("../../../../../lib/roleIdentity");

module.exports = class AddOrRemove1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      BanishedAddOrRemove: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
        if (Random.randInt(0, 1) == 0) {
          let players = this.game.players.filter(
            (p) =>
              (p.role.alignment == "Village" ||
                p.role.alignment == "Independent") &&
              !p.role.data.banished &&
              !p.role.data.reroll
          );
          let shuffledPlayers = Random.randomizeArray(players);
          let roles = this.game.banishedRoles;
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
          for (let item of shuffledPlayers[0].items) {
            item.drop();
          }
          shuffledPlayers[0].setRole(
            newRole,
            undefined,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
          //this.game.originalRoles[suffledPlayers[0].id] = newRole;
          const selectedIndex = roles.findIndex((role) => roleEquals(role, newRole));
          if (selectedIndex !== -1) roles.splice(selectedIndex, 1);
        } else {
          let players = this.game.players.filter(
            (p) =>
              (p.role.alignment == "Village" ||
                p.role.alignment == "Independent") &&
              p.role.data.banished &&
              !p.role.data.reroll
          );
          if (players.length == 0) return;

          let shuffledPlayers = Random.randomizeArray(players);
          let banishedRoles = this.game.banishedRoles;
          let roles = this.game.PossibleRoles.filter((r) => r);
          let currentRoles = [];
          let playersAll = this.game.players.filter((p) => p.role);
          for (let x = 0; x < playersAll.length; x++) {
            //currentRoles.push(playersAll[x].role);
            currentRoles.push(playersAll[x].role.toRoleData());
          }
          for (let y = 0; y < currentRoles.length; y++) {
            roles = roles.filter(
              (r) => !roleEquals(r, currentRoles[y])
            );
          }
          roles = roles.filter(
            (r) =>
              !roleName(r).toLowerCase().includes("banished") &&
              !roleModifiers(r).toLowerCase().includes("banished")
          );
          roles = roles.filter(
            (r) => this.game.getRoleAlignment(roleName(r)) == "Village"
          );

          let newRole = Random.randArrayVal(roles);
          for (let item of shuffledPlayers[0].items) {
            item.drop();
          }
          shuffledPlayers[0].role.data.banished = false;
          shuffledPlayers[0].setRole(
            newRole,
            undefined,
            false,
            true,
            null,
            null,
            "RemoveStartingItems"
          );
        }
      },
    };
  }
};
