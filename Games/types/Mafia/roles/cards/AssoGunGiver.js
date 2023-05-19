const Card = require("../../Card");
const { PRIORITY_ITEM_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class AssoGunGiver extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Give Gun": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive"], exclude: ["Mafia"] },
                action: {
                    labels: ["giveItem", "gun"],
                    priority: PRIORITY_ITEM_GIVER_DEFAULT,
                    run: function () {
                        this.target.holdItem("Gun", { mafiaImmune: true });
                        this.queueGetItemAlert("Gun");
                    }
                }
            }
        };
    }

}
