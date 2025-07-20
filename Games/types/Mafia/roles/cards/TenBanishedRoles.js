const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const roleBlacklist = ["Hermit", "Jack", "Consigliere", "Sidhe"];

module.exports = class TenBanishedRoles extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if(this.HasGainedAbilites == true){
          return;
        }

        this.HasGainedAbilites = true;
        this.GainedBanishedRoles = [];
        let roles = Random.randomizeArray(this.game.PossibleRoles.filter((r) => !roleBlacklist.includes(r.split(":"))[0] && r.split(":").includes("Banished")));
        for(let x = 0; (x < 5 && x < roles.length); x++){
          if(roles[x]){
          let role = this.player.addExtraRole(roles[x]);
          this.GainedBanishedRoles.push(role);
          this.player.passiveExtraRoles.push(role);
          }
        }
      },
    };
  }
};
