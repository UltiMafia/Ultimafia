const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Remove1Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      removeBanished: function (player) {
        if (player != this.player) return;
        if (this.reroll) return;

        let players = this.game.players.filter(
          (p) =>
            (p.role.alignment == "Village" ||
              p.role.alignment == "Independent") &&
            p.role.data.banished
        );
        if(players.length == 0) return;
        
        let shuffledPlayers = Random.randomizeArray(players);
        let banishedRoles = this.game.banishedRoles;
        let roles = this.game.PossibleRoles;
        let currentRoles = [];
        for (let x = 0; x < this.game.players.length; x++) {
            currentRoles.push(this.game.players[x].role);
        }
        for (let x = 0; x < roles.length; x++) {
            if (currentRoles.includes(roles[x])) {
              roles.slice(roles.indexOf(roles[x]), 1);
            }
        }
        for (let x = 0; x < roles.length; x++) {
            if (banishedRoles.includes(roles[x])) {
              roles.slice(roles.indexOf(roles[x]), 1);
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
