const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class GiveTurkeyOnDeath extends Card {

    constructor(role) {
        super(role);
        
        this.meetings = {
            "Turkey Meeting": {
                states: ["Night"],
                flags: ["group", "speech"]
            }
        };

        this.listeners = {
            "death": function (player, killer, deathType) {
                if (player == this.player) {
                    this.game.queueAlert(":sy9c: The town cooks the Turkey and turns it into 2 meals for everyone!");
                    for (let person of this.game.players) {
                        if (person.alive && person.role.name !== "Turkey") {
                            person.holdItem("Turkey");
                            person.holdItem("Turkey");
                        }
                    }
                }
            },
            "start": function () {
                for (let player of this.game.players) {
                    if (
                        player.role.name === "Turkey" &&
                        player !== this.player
                    ) {
                        this.revealToPlayer(player);
                    }
                }

                for (let player of this.game.players) {
                    // give bread
                    let items = player.items.map(a => a.name);
                    let breadCount = 0;
                    for (let item of items) {
                        if (item === "Bread")
                            breadCount++;
                    }
                    while (breadCount < 4) {
                        player.holdItem("Bread");
                        breadCount++;
                    }

                    // give effect and message
                    if (!player.hasEffect("Famished")) {
                        player.giveEffect("Famished");
                    }
                }

                if (!this.game.alertedTurkeyInGame) {
                    this.game.queueAlert("A turkey runs rampant, consuming all the food. You feel hungry.");
                    this.game.alertedTurkeyInGame = true;
                }
            }
        };
        
    }

}