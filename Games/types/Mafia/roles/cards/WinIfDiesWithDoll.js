const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfDiesWithDoll extends Card {

    constructor(role) {
        super(role);
        
        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT,
            againOnFinished: true,
            check: function (counts, winners, aliveCount) {
                if (this.data.dollDeath && !winners.groups[this.name]) {
                    winners.addPlayer(this.player, this.name);
                }
            }
        };
        
        this.listeners = {
            "death": function (player, killer, deathType) {
                if (player.hasItem("Doll") && player.role !== this.player.role) {
                    this.data.dollDeath = true;
                }
            }
        };
    }

}
