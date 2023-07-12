const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealCharms extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Steal From": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive"], exclude: ["dead", "self"] },
                action: {
                    labels: ["stealItem", "kill"],
                    priority: PRIORITY_ITEM_TAKER_DEFAULT,
                    run: function() {
                        const stolenItem = this.stealRandomItem();
                        if (stolenItem?.name === "Lucky Charm") {
                                this.target.queueAlert("Your lucky charm has been stolen!");
                            }
                        }
                    }
                }
            }
    }
}