const Card = require("../../Card");

module.exports = class AppearAsRandomRole extends Card {
  constructor(role) {
    super(role);

    this.appearance = {
      self: "real",
      reveal: this.actor.role.data.role,
      condemn: this.actor.role.data.role,
      death: this.actor.role.data.role,
      investigate: this.actor.role.data.role,
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        let roles = [];
        
        for (let player of this.game.players) {
          roles.push(player.role.name);
        }
        this.actor.role.data.role = Random.randArrayVal(roles);
      },
    };
  }
};
