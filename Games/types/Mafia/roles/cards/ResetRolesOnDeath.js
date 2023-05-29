const Card = require("../../Card");

module.exports = class ResetRolesOnDeath extends Card {

    constructor(role) {
        super(role);
        this.listeners = {
            "death": function (player, killer, deathType) {
                if (player === this.player){
                    for (let _player of this.game.players){
                        if (_player.alive){
                            _player.setRole(this.data.originalRoles[_player.name]);
                        }
                    }
                }
            },
            "start": function () {
                this.data.originalRoles = {};
                for (let player of this.game.players){
                    this.data.originalRoles[player.name] = `${player.role.name}:${player.role.modifier}`;
                }
            },
        };
    }

}