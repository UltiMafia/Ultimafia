const Meeting = require("../Meeting");

module.exports = class VillageMeeting extends Meeting {

    constructor(game) {
        super(game, "Village");

        this.actionName = "Village Vote";
        this.group = true;
        this.speech = true;
        this.voting = true;
        this.targets = { include: ["alive"], exclude: [] }
    }

    vote(voter, selection) {
        var voted = super.vote(voter, selection);

        if (
            voted &&
            Object.keys(this.votes).length == this.totalVoters - 1 &&
            this.game.timers["main"] &&
            !this.game.timers["secondary"]
        ) {
            this.game.createTimer("secondary", 60000, () => this.game.checkVeg());
        }
    }

    unvote(voter) {
        var unvoted = super.unvote(voter);

        if (unvoted && this.game.timers["secondary"])
            this.game.clearTimer("secondary");
    }

    finish(isVote) {
        super.finish(isVote);

        for (let member of this.members) {
            if (member.player.role.alignment == "Village" && this.votes[member.id] && this.votes[member.id] != "*") {
                let role = this.game.getPlayer(this.votes[member.id]).role;

                if (role.alignment != "Village" && role.winCount != "Village")
                    member.player.recordStat("reads", true);
                else
                    member.player.recordStat("reads", false);
            }

            // Check if player vegged. If so, then DON'T record survival.
            // Because we should record this stat in the veg function in Mafia/Game.js instead.
            if(this.votes[member.id] === undefined){
                return;
            }

            if (member.player == this.finalTarget)
                member.player.recordStat("survival", false);
            else
                member.player.recordStat("survival", true);
        }
    }

}
