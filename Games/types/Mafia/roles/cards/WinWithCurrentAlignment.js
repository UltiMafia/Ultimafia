const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithCurrentAlignment extends Card {

    constructor(role) {
        super(role);

        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT + 1,
            againOnFinished: true,
            check: function (counts, winners, aliveCount, confirmedFinished) {
                if (this.player.alive && Object.keys(winners.groups).includes(this.player.role.alignment)) {
                  winners.addPlayer(this.player, this.name);
                }
            }
        };
    }

}