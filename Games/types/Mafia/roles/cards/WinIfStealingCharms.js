const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Math2 = require("../../../../../lib/Math2");

module.exports = class WinByStealingCharms extends Card {

    constructor(role) {
        super(role);

        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT,
            againOnFinished: true,
            check: function (counts, winners, aliveCount) {
                if (!winners.groups[this.name] && this.player.alive && this.player.getItems("Lucky Charm").length >= this.data.charmTarget) {
                    winners.addPlayer(this.player, this.name)
                }
            }
        };
        this.listeners = {
            "start": function () {
                this.data.charmTarget = 2;
                this.data.charmSpawn = Math.round(Math2.lerp(this.data.charmTarget, this.game.players.length, 0.2));
                if (this.game.players.filter(e => e.alive).map(e => e.items).flat().filter(e => e.name === "Lucky Charm").length === this.data.charmSpawn) {
                    return;
                }

                let eligiblePlayers = this.game.players.filter(e => e !== this.player && e.role.name !== this.player.role.name);
                if (eligiblePlayers.length < this.data.charmSpawn) {
                   eligiblePlayers = this.game.players;
                }
                if (forcedCharmers.length < this.data.charmSpawn) {
                    let remainingCharms = this.data.CharmSpawn - forcedCharmers.length;
                    const shuffled = eligiblePlayers.filter(e => !e.hasItem("Lucky Charm")).sort(()=>0.5-Math.random());
                    shuffled.slice(0, remainingCharms).forEach(e => {
                        e.holdItem("Lucky Charm");
                        e.queueAlert("You have received a lucky charm!");
                    })
                }
            },
        };
    }

}