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
                if (!winners.groups[this.name] && this.player.alive && this.player.getItems("Charm").length >= this.data.charmTarget) {
                    winners.addPlayer(this.player, this.name)
                }
            }
        };
        this.listeners = {
            "start": function () {
                this.data.charmTarget = 3;
                this.data.charmSpawn = Math.round(Math2.lerp(this.data.charmTarget, this.game.players.length, 0.8));

                const charmersNumber = this.game.players.filter(e => charmRoles.includes(e.role.name)).length;
                this.data.charmSpawn -= charmersNumber;

                const charmsInGame = this.game.players.filter(e => e.alive).map(e => e.items).flat().filter(e => e.name === "Lucky Charm").length;

                //If charms are already spawned, skip (handles multi-charmstealer setups)

                if (charmsInGame === this.data.charmSpawn) {
                    return;
                }

                let eligiblePlayers = this.game.players.filter(e =>
                    e !== this.player &&
                    e.role.name !== this.player.role.name &&
                    !charmRoles.includes(e.role.name));
                if (eligiblePlayers.length === 0) {
                   eligiblePlayers = this.game.players.filter(e => e);
                }

                let shuffled = eligiblePlayers.sort(()=>0.5-Math.random());
                let internalIndex = 0;
                for (let i= 0; i < this.data.charmSpawn; i++) {
                    if (!shuffled[internalIndex]) {
                        shuffled = eligiblePlayers.sort(()=>0.5-Math.random());
                        internalIndex = 0;
                    }
                    shuffled[internalIndex].holdItem("Lucky Charm");
                    shuffled[internalIndex].queueAlert("You possess a lucky charm!");
                    internalIndex++;
                }
            },
        };
    }

}
