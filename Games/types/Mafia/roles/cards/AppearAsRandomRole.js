const Card = require("../../Card");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      reveal: this.actor.role.data.appearance,
      condemn: this.actor.role.data.appearance,
      death: this.actor.role.data.appearance,
      investigate: this.actor.role.data.appearance,
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
        this.actor.role.data.appearance = Random.randArrayVal(roles);
      },
    };
  }
};
