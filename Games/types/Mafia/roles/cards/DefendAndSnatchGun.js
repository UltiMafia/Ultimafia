const Card = require("../../Card");
const Action = require("../../Action");
const Random = require("../../../../../lib/Random");

module.exports = class DefendAndSnatchGun extends Card {

    constructor(role) {
        super(role);

        this.immunity["gun"] = "Infinity";
        this.listeners = {
            "immune": function(action) {
                if (action.target !== this.player) {
                    return
                }

                if (!action.hasLabel("gun")) {
                    return
                }

                let toSnatch = Random.randFloatRange(0, 100) <= 80;
                if (toSnatch) {
                    action.item.hold(this.player);
                    action.item.incrementMeetingName();
                    this.game.instantMeeting(action.item.meetings, [this.player]);
                    return;
                }

                let killAction = new Action({
                    // do not add gun label
                    labels: ["kill"],
                    actor: this.player,
                    target: this.player,
                    game: this.player.game,
                    run: function() {
                        if (this.dominates()) {
                            this.target.kill("gun", action.actor, true);;
                        }
                    }
                })
                this.game.instantAction(killAction);
            }
        };
    }

}