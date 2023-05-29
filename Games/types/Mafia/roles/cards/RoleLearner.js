const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class RoleLearner extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Learn Role": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["investigate", "role"],
                    priority: PRIORITY_INVESTIGATIVE_DEFAULT,
                    run: function () {
                        var role = this.target.getAppearance("investigate", true);
                        var alert = `:sy0d: You learn that ${this.target.name}'s role is ${role}.`;
                        this.actor.queueAlert(alert);
                    }
                }
            }
        };
    }

}