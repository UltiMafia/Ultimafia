const Item = require("../Item");
const { MEETING_DEAD_PARTY } = require("../const/MeetingPriority");

module.exports = class Flier extends Item {

    constructor(reveal) {
        super("Flier");

        this.reveal = reveal;
        this.lifespan = 1;
        this.cannotBeStolen = true;
        this.cannotBeSnooped = true;

        this.meetings = {
            "Party!": {
                actionName: "Done Partying?",
                states: ["Night"],
                flags: ["group", "speech", "voting", "mustAct", "noVeg"],
                inputType: "boolean",
                passiveDead: true,
                whileDead: true,
                speakDead: true,
                priority: MEETING_DEAD_PARTY,
            }
        };
    }
}