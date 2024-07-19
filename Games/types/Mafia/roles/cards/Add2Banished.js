const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class Add2Banished extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      reroll: function (player) {
        if (player != this.player) return;

        //let players = this.game.players.filter((p) => p.role.alignment == "Villager" && !p.role.reroll);
        let players = this.game.players.filter((p) => (p.role.alignment == "Village" || p.role.alignment == "Independent"));
        let shuffledPlayers = Random.randomizeArray(players).filter((p) => !(p.role.toLowerCase().includes("banished")));
        let roles = this.game.getBanishedRoles();
        for (let i = 0; i < 2; i++){
          //this.game.excessRoles["Villager"].push(shuffledPlayers[i].role.name);
          //this.game.rollQueue.push(shuffledPlayers[i].name);
          if(this.game.setup.unique){
            let currentBanishedPlayers = this.game.players.filter((p) => (p.role.toLowerCase().includes("banished")));
            let currentBanishedRoles = [];
            for(let x = 0;x<currentBanishedPlayers.length;x++){
            currentBanishedRoles.push(currentBanishedPlayers[x].role);
            }
            for(let x = 0;x<roles.length){
            if(currentBanishedRoles.includes(roles [x])){
              roles.slice(roles.indexOf(roles[x]), 1);
            }
            }
          }
          let newRole = Random.randArrayVal(roles);
          shuffledPlayers[i].setRole(newRole, undefined, false, true);
          this.game.originalRoles[suffledPlayers[i].id] = newRole;
          roles.slice(roles.indexOf(newRole), 1);
        }
        //this.game.excessRoles["Outcast"] = roles;
      },
    };

    this.reroll = true;
  }
};
