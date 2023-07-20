const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class FamineStarter extends Card {

    constructor(role) {
        super(role);

        this.listeners = {
            "start": function () {
                this.game.famineStarted = true;

                for (let player of this.game.players) {
                    // give bread
                    let items = player.items.map(a => a.name);
                    let breadCount = 0;
                    for (let item of items) {
                        if (item === "Bread")
                            breadCount++;
                    }
                    while (breadCount < 2) {
                        player.holdItem("Bread");
                        breadCount++;
                    }

                    // give effect
                    if (!player.hasEffect("Famished"))
                        player.giveEffect("Famished");
                }
            },
        };
    }

}