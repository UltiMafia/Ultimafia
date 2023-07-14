const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Math2 = require("../../../../../lib/Math2");

module.exports = class WinByStealingClovers extends Card {

    constructor(role) {
        super(role);

        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT,
            againOnFinished: true,
            check: function (counts, winners, aliveCount) {
                if (!winners.groups[this.name] && this.player.alive && this.player.getItems("Clover").length >= this.data.cloverTarget) {
                    winners.addPlayer(this.player, this.name)
                }
            }
        };
        this.listeners = {
            "start": function () {
                this.data.cloverTarget = 3;
                this.data.cloverSpawn = Math.round(Math2.lerp(this.data.cloverTarget, this.game.players.length, 0.8));

                const cloverersNumber = this.game.players.filter(e => cloverRoles.includes(e.role.name)).length;
                this.data.cloverSpawn -= cloverersNumber;

                const cloversInGame = this.game.players.filter(e => e.alive).map(e => e.items).flat().filter(e => e.name === "Clover").length;

                //If clovers are already spawned, skip (handles multi-cloverstealer setups)

                if (cloversInGame === this.data.cloverSpawn) {
                    return;
                }

                let eligiblePlayers = this.game.players.filter(e =>
                    e !== this.player &&
                    e.role.name !== this.player.role.name &&
                    !cloverRoles.includes(e.role.name));
                if (eligiblePlayers.length === 0) {
                   eligiblePlayers = this.game.players.filter(e => e);
                }

                let shuffled = eligiblePlayers.sort(()=>0.5-Math.random());
                let internalIndex = 0;
                for (let i= 0; i < this.data.cloverSpawn; i++) {
                    if (!shuffled[internalIndex]) {
                        shuffled = eligiblePlayers.sort(()=>0.5-Math.random());
                        internalIndex = 0;
                    }
                    shuffled[internalIndex].holdItem("Clover");
                    shuffled[internalIndex].queueAlert("You possess a four-leaf clover!");
                    internalIndex++;
                }
            },
        };
    }

}
