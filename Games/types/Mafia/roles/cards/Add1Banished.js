const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Add1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      addBanished: function (player) {
        if (player != this.player) return;
        if (this.reroll) return;
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
            currentBanishedRoles.push(
              `${this.target.role.name}:${this.target.role.modifier}`
            );
          }
          for (let x = 0; x < roles.length; x++) {
            if (currentBanishedRoles.includes(roles[x])) {
              roles.slice(roles.indexOf(roles[x]), 1);
            }
          }
        }
        let newRole = Random.randArrayVal(roles);
        shuffledPlayers[0].setRole(newRole, undefined, false, true);
        //this.game.originalRoles[suffledPlayers[0].id] = newRole;
        roles.slice(roles.indexOf(newRole), 1);
      },
    };
  }
};
