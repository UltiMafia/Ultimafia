const Card = require("../../Card");

module.exports = class MeetingGhost extends Card {

    constructor(role) {
        super(role);
        
        this.listeners = {
            "start": function () {
                for (let player of this.game.players) {
                    if (player.role.alignment == "Ghost" && player != this.player) {
                        this.revealToPlayer(player);
                    }
                }
                
                this.player.queueAlert(`Guess the hidden word of length: ${this.game.wordLength}`);
            }
        }

        this.meetings = {
            "Ghost": {
                actionName: "Select Leader",
                states: ["Night"],
                flags: ["group", "speech", "voting", "mustAct"],
                targets: { include: ["alive"] },
                action: {
                    run: function () {
                        this.game.startRoundRobin(this.target);
                    }
                }
            }
        };
    }

}
