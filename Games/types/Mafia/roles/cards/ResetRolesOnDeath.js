const Card = require("../../Card");

module.exports = class ResetRolesOnDeath extends Card {
  constructor(role) {
    super(role);
    this.listeners = {
      death: function (player) {
        if (player !== this.player) {
          return;
        }

        if (!this.hasAbility(["Convert", "WhenDead"])) {
          return;
        }

        for (let _player of this.game.players) {
          if (_player.alive) {
            _player.setRole(
              this.game.originalRoles[_player.id],
              _player.role.data
            );
          }
        }
      },
      roleAssigned: function (player) {
        if (player != this.player) return;
        this.data.originalRoles = {};
        for (let player of this.game.players) {
          this.data.originalRoles[
            player.name
          ] = `${player.role.name}:${player.role.modifier}`;
        }
      },
    };
  }
};
