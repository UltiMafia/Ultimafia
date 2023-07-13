const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealAllItemsAndCharms extends Card {

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
                            if (this.target.hasItem("Charm")) {
                                this.stealItemByName("Lucky Charm", null, null, ":You stole a lucky charm!")
                                this.target.queueAlert("Your lucky charm has been stolen!");
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
