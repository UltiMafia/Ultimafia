const Card = require("../../Card");
const { PRIORITY_CONVERT_DEFAULT } = require("../../const/Priority");

module.exports = class AlignmentLearner extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Strip Power from": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["convert"],
                    priority: PRIORITY_CONVERT_DEFAULT,
                    run: function () {
                        if (this.target.role.alignment != "Mafia") {
                            return;
                        }

                        if (this.dominates()) {
                            this.target.setRole("Mafioso");
                            this.actor.queueAlert(`You have converted ${this.target.name} into a Mafioso!`)
                        }
                    }
                }
            }
        }
    };

}
