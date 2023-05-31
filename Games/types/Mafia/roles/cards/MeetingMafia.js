const Card = require("../../Card");
const { PRIORITY_MAFIA_KILL } = require("../../const/Priority");

module.exports = class MeetingMafia extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Mafia": {
                actionName: "Mafia Kill",
                states: ["Night"],
                flags: ["group", "speech", "voting", "multiActor"],
                targets: { include: ["alive"], exclude: [excludeMafiaOnlyIfNotAnonymous] },
                action: {
                    labels: ["kill", "mafia"],
                    priority: PRIORITY_MAFIA_KILL,
                    run: function () {
                        if (this.dominates())
                            this.target.kill("basic", this.actor);
                    }
                }
            }
        };
    }

}

function excludeMafiaOnlyIfNotAnonymous(player) {
    let mafiaMeeting = player.game.getMeetingByName("Mafia");
    if (mafiaMeeting.anonymous) {
        return false
    }

    if (player.role.alignment == "Mafia") {
        return true;
    }
}