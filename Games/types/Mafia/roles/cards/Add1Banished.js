const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Add1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addBanished: function (player) {
        if (player != this.player) return;
        this.player.role.data.reroll = true;
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
          let currentBanishedRoles = [];
          for (let x = 0; x < currentBanishedPlayers.length; x++) {
            let tempName = currentBanishedPlayers[x].role.name;
            let tempModifier = currentBanishedPlayers[x].role.modifier;
            currentBanishedRoles.push(`${tempName}:${tempModifier}`);
          }
          let match = false;
          let validRoles = [];
          for (let x = 0; x < roles.length; x++) {
            for (let y = 0; y < currentBanishedRoles.length; y++) {
              if (roles[x] == currentBanishedRoles[y]) {
                roles.slice(roles.indexOf(roles[x]), 1);
                match = true;
              }
            }
            if (!match) {
              validRoles.push(roles[x]);
            }
            match = false;
            /*
            if (currentBanishedRoles.includes(roles[x])) {
              roles.slice(roles.indexOf(roles[x]), 1);
            }
            */
          }
          roles = validRoles;
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
        roles.slice(roles.indexOf(newRole), 1);
      },
    };
  }
};
