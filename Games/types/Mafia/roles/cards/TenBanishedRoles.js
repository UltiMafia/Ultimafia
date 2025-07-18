const Card = require("../../Card");
const roleBlacklist = ["Hermit","Jack", "Consigliere", "Sidhe"];

module.exports = class TenBanishedRoles extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) {
          return;
        }
        if(this.data.HasGainedAbilites == true){
          return;
        }

        this.data.HasGainedAbilites = true;
        this.data.GainedBanishedRoles = [];
        let roles = Random.randomizeArray(this.game.banishedRoles).filter((r) => );
        for(let x = 0; (x < 10 || x < roles.length); x++){
          let role = this.player.addExtraRole(roles[x]);
          this.data.GainedBanishedRoles.push(role);
        }
      },
    };
  }
};
