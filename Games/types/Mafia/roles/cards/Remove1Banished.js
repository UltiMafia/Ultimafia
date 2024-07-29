const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Remove1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      removeBanished: function (player) {
        if (player != this.player) return;
        if (this.reroll) return;
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
          currentRoles.push(playersAll[x].role);
        }
        for (let y = 0; y < currentRoles.length; y++) {
          roles = roles.filter((r) => r.split(":")[0] != currentRoles[y].name);
        }
        roles = roles.filter((r) => r.toLowerCase().includes("banished"));

        let newRole = Random.randArrayVal(roles);
        shuffledPlayers[0].setRole(newRole, undefined, false, true);
        //this.game.originalRoles[suffledPlayers[0].id] = newRole;
        roles.slice(roles.indexOf(newRole), 1);
      },
    };
  }
};
