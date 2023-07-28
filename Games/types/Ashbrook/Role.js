const Role = require("../../core/Role");
const AshbrookAction = require("./Action");

module.exports = class AshbrookRole extends Role {
  constructor(name, player, data) {
    super(name, player, data);

    this.Action = AshbrookAction;

    this.appearance = {
      self: "real",
      reveal: "real",
      condemn: "real",
      death: "real",
      investigate: "real",
    };
  }

  evilReveal(player, type) {
    player.history.recordRole(this.player, type);
    player.send("reveal", { playerId: this.player.id, role: type });

    if (type == "Follower"){
      player.queueAlert(`${this.player.name} is a faithful Follower of yours.`);
    } else {
      player.queueAlert(`${this.player.name} is your Leader.`);
    }

  }
};
