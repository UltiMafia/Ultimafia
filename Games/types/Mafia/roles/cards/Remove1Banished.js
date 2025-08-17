const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Remove1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      removeBanished: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
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
          let tempName = playersAll[x].role.name;
          let tempModifier = playersAll[x].role.modifier;
          currentRoles.push(`${tempName}:${tempModifier}`);
        }
        for (let y = 0; y < currentRoles.length; y++) {
          roles = roles.filter(
            (r) => r != currentRoles[y] && !currentRoles[y].includes(r)
          );
        }
        roles = roles.filter((r) => !r.toLowerCase().includes("banished"));
        roles = roles.filter((r) => this.game.getRoleAlignment(r) == "Village");

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
      },
    };
  }
};
