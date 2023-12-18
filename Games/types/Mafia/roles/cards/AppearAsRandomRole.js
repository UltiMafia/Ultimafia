const Card = require("../../Card");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      reveal: this.player.role.data.appearance,
      condemn: this.player.role.data.appearance,
      death: this.player.role.data.appearance,
      investigate: this.player.role.data.appearance,
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        let roles = [];
        
        for (let player of this.game.players) {
          let role = player.role.name;
          if (role === "Villager" || role === "Impersonator" || role === "Imposter") return;
          roles.push(role);
        }
        this.player.role.data.appearance = Random.randArrayVal(roles);
      },
    };
  }
};
