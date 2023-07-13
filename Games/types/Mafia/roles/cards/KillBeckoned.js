const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillBeckoned extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Beckon": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["kill"],
                    priority: PRIORITY_KILL_DEFAULT,
                    run: function () {
                        if (!this.actor.role.data.beckoned) {
                            this.actor.role.data.beckoned = 0;
                        }
                        const visitors = this.getVisitors();
                        if (visitors?.length > 0) {
                            const beckonedVisitor = visitors.find(e => e===this.target);
                            if (beckonedVisitor && this.dominates()) {
                                this.actor.queueAlert(`:mermaid: You successfully beckon ${this.target.name} with your song, dragging them to a watery grave.`)
                                this.target.kill("basic", this.actor);
                                this.actor.role.data.beckoned++
                            }
                        }
                    }
                }
            }
        };
    }

}