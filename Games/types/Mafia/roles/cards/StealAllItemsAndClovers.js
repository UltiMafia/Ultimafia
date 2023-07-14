const Card = require("../../Card");
const { PRIORITY_ITEM_TAKER_DEFAULT } = require("../../const/Priority");

module.exports = class StealAllItemsAndClovers extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Steal From": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive", "dead"], exclude: ["self"] },
                action: {
                    labels: ["stealItem", "kill"],
                    priority: PRIORITY_ITEM_TAKER_DEFAULT,
                    run: function() {
                        let stealItem = false;
                        let killActor = false;
                        switch (this.target.role.name) {
                            case "Leprechaun":
                                if (this.dominates()) {
                                    this.actor.queueAlert(`You discover that ${this.target.name} is kin and murder them for their wares!`);
                                    this.target.kill("basic", this.actor);
                                }
                                stealItem = true;
                                break;
                            default:
                                stealItem = true;
                                break;
                        }
                        if (stealItem) {
                            if (this.target.hasItem("Clover")) {
                                this.target.queueAlert("Your four-leaf clover has been stolen!")
                                this.actor.queueAlert("You stole a four-leaf clover!")
                            } else {
                                this.stealRandomItem();
                            }
                        }

                        if (killActor && this.dominates(this.actor)) {
                            this.actor.kill("basic", this.target);
                        }
                    }
                }
            },
        }
    }
}
