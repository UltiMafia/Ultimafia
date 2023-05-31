const Card = require("../../Card");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class ReadMind extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Read Mind": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["investigate"],
                    priority: PRIORITY_INVESTIGATIVE_DEFAULT,
                    run: function () {
                        let visitors = this.getVisitors();
                        if (visitors.length > 0) {
                            this.actor.queueAlert(`You tried to read ${this.target.name}'s mind, but was distracted.`);
                            return
                        }

                        let alignment = this.target.role.alignment;

                        if (alignment != "Independent") {
                            alignment = `sided with the ${alignment}`
                        }

                        this.actor.queueAlert(`You read ${this.target.name}'s mind and learn that they are ${alignment}.`);
                    }
                }
            }
        }
    };

}
