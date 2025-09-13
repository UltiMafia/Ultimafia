const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");

module.exports = class ReplaceWithBanishedRole extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      replaceWithBanished: function (player) {
        let banishedRoles = this.game.banishedRoles;
        let currentRoles = this.game.players.map((p) => `${p.role.name}:${p.role.modifier}`);
        let currentBanished = currentRoles.filter((r) => r.split(":")[1] && r.split(":")[1].includes("Banished"));
        let tempBanished = banishedRoles.filter((b) => !currentBanished.includes(b));
        if(tempBanished.length <= 0){
          if(banishedRoles.length <= 0){
            banishedRoles = ["Villager:Banished", "Mafioso:Banished", "Cultist:Banished", "Grouch:Banished"];
          }
            tempBanished = banishedRoles;
        }
          if(this.role.name != "Banished Any"){
            tempBanished = tempBanished.filter(this.game.getRoleAlignment(r.split(":")[0]) != this.alignment);
            if(tempBanished.length <= 0){
              tempBanished = ["Villager:Banished", "Mafioso:Banished", "Cultist:Banished", "Grouch:Banished"].filter(this.game.getRoleAlignment(r.split(":")[0]) != this.alignment);
            }
          }
          let newRole = Random.randArrayVal(tempBanished);
          this.player.setRole(newRole, undefined, false,true,null,null,"RemoveStartingItems");
      },
    };
  }
};
