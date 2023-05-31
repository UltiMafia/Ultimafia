const Card = require("../../Card");
const { PRIORITY_KILL_DEFAULT } = require("../../const/Priority");

module.exports = class KillConverters extends Card {

    constructor(role) {
        super(role);

        this.role.killLimit = 2;

        this.actions = [
            {
                priority: PRIORITY_KILL_DEFAULT,
                labels: ["kill", "hidden"],
                run: function () {
                    if (!this.actor.alive)
                        return;

                    if (this.game.getStateName() != "Night")
                        return;

                    if (this.actor.role.killLimit <= 0) {
                        return;
                    }

                    var convertingVisitors = this.getVisitors(this.actor, "convert");

                    for (let visitor of convertingVisitors) {
                        if (this.actor.role.killLimit > 0 && this.dominates(visitor)) {
                            visitor.kill("basic", this.actor);
                            this.actor.role.killLimit--;
                        }
                    }       
                }
            }
        ];
    }
}