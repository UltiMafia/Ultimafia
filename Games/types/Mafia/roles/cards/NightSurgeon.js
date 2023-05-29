const Card = require("../../Card");
const Random = require("../../../../..//lib/Random");
const { PRIORITY_NIGHT_SAVER } = require("../../const/Priority");

module.exports = class NightSurgeon extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Save": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["save", "kill"],
                    priority: PRIORITY_NIGHT_SAVER,
                    run: function () {
                        this.preventConvert();
                        this.heal();

                        let attackers = this.getVisitors(this.target, "kill");
                        let parsedAttackers = attackers.filter(a => a.role.name != "Surgeon");

                        let toKill = Random.randArrayVal(parsedAttackers);
                        if (this.dominates(toKill)) {
                            toKill.kill(this.actor);
                        }
                    }
                }
            }
        };
    }

}
