const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class NightSurgeon extends Card {

    constructor(role) {
        super(role);
        
        this.meetings = {
            "Trap": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["kill"],
                    item: role,
                    priority: PRIORITY_KILL_DEFAULT,
                    run: function () {
                        let actorRole = this.item;
                        
                        // remove this actor
                        let visitors = this.getVisitors(this.target)
                            .sort((x, y) => actorRole.mapAlignment(x.role.alignment) - actorRole.mapAlignment(y.role.alignment))
                            .filter(p => p != this.actor);

                        if (visitors.length <= 0) {
                            return
                        }

                        let toKill = visitors[0];
                        if (this.dominates(toKill)) {
                            toKill.kill(this.actor);
                        }

                        let toLearnRole = visitors.slice(1)
                        this.game.queueAlert(`You learn that ${this.actor.name} is the ${actorRole.name}.`, 0, toLearnRole);
                    }
                }
            }
            
        };

        // map all to same
        role.mapAlignment = x => 0;
    }

}
