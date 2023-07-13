const Card = require("../../Card");
const { PRIORITY_ALIGNMENT_LEARNER } = require("../../const/Priority");

module.exports = class AlignmentLearnerDelayed extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Learn Alignment Delayed": {
                actionName: "Learn Alignment",
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["investigate", "alignment"],
                    priority: PRIORITY_ALIGNMENT_LEARNER,
                    run: function () {
                        var alignment = this.game.getTargetAlignment(this.target);

                        if (alignment == "Independent")
                            alignment = "neither the Village, Mafia, nor Monsters"
                        else
                            alignment = `the ${alignment}`;

                        var alert = `:sy0d: You learn that ${this.target.name} is sided with ${alignment}.`;
                        if (!this.actor.role.data.delayedCopReports) {
                            this.actor.role.data.delayedCopReports = [];
                        }
                        this.actor.role.data.delayedCopReports.push(alert);
                    }
                }
            }
        }

        this.listeners = {
            "state": function (stateInfo) {
                if (!stateInfo.name.includes("Night")) {
                    return;
                }
                if (this.player.role.data.delayedCopReports?.length > 0) {
                    this.game.queueAlert(this.player.role.data.delayedCopReports.shift(), 0, this.player.role.meetings["Learn Alignment Delayed"].action.meeting.getPlayers());
                }
            }
        }
    };

}