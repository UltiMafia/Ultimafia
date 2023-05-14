const Card = require("../../Card");
const { PRIORITY_EFFECT_GIVER_DEFAULT } = require("../../const/Priority");

module.exports = class Silencer extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Silence": {
                states: ["Night"],
                flags: ["voting"],
                targets: { include: ["alive"], exclude: ["Mafia"] },
                action: {
                    labels: ["effect", "silence"],
                    priority: PRIORITY_EFFECT_GIVER_DEFAULT,
                    run: function () {
                        if (this.dominates()) {
                            this.target.giveEffect("Silenced", 1);
                            this.queueGetEffectAlert("Silenced");
                        }
                    }
                }
            }
        };
    }

}