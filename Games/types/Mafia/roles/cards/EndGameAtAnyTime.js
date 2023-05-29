const Card = require("../../Card");

module.exports = class EndGameAtAnyTime extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "End Game?": {
                states: ["*"],
                flags: ["voting", "instant", "noVeg"],
                inputType: "boolean",
                action: {
                    run: function () {
                        if (this.target == "Yes") {
                            this.game.immediateEnd();
                        }
                    }
                }
            }
        };
    }
}
