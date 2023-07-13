const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class SabotageAllItems extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Sabotage": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive"], exclude: ["Mafia"] },
                action: {
                    labels: ["sabotage"],
                    priority: PRIORITY_ITEM_TAKER_DEFAULT - 1,
                    run: function () {
                        for (let item of this.target.items) {
                            item.cursed = true;
                        }
                    }
                }
            }
        };
    }

}