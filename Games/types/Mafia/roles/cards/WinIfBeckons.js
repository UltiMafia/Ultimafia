const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinIfBeckons extends Card {

    constructor(role) {
        super(role);

        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT,
            againOnFinished: true,
            check: function (counts, winners, aliveCount, confirmedFinished) {
                if (
                    this.player.alive &&
                    this.player.role.data.beckoned >= 2
                ) {
                    winners.addPlayer(this.player, this.name);
                }
            }
        };
    }

}