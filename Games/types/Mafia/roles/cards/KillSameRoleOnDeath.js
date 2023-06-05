const Card = require("../../Card");

module.exports = class KillSameRoleOnDeath extends Card {
  constructor(role) {
    super(role);

    this.listeners = {
      state: function (stateInfo) {
        if (stateInfo.id == 0) this.data.leader = true;
      },
      death: function (player, killer, deathType, instant) {
        if (player == this.player && this.data.leader)
          for (let _player of this.game.players)
            if (_player.alive && _player.role.name == this.name)
              _player.kill("basic", this.player, instant);
      },
    };
  }
};
