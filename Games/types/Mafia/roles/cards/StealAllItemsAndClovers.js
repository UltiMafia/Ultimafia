const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealAllItemsAndClovers extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Steal From": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive"], exclude: ["dead", "self"] },
                action: {
                    labels: ["stealItem"],
                    priority: PRIORITY_ITEM_TAKER_DEFAULT,
                    run: function() {
                        let stealItem = false;
                        if (stealItem) {
                            if (this.target.hasItem("Clover")) {
                                this.stealItemByName("Clover", null, null, ":You stole a four-leaf clover!")
                                this.target.queueAlert("Your four-leaf clover has been stolen!");
                            } else {
                                this.stealRandomItem();
                            }
                        }
                    }
                }
            },
        }
    }
}
