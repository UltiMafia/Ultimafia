const Effect = require("../Effect");

module.exports = class Whistleblown extends Effect {

    constructor(lifespan) {
        super("Whistleblown");
        this.lifespan = lifespan || Infinity;
    }

    apply(player) {
        super.apply(player);

        this.cannotVoteEffect = player.giveEffect("CannotVote", 1);
        this.cannotBeVotedEffect = player.giveEffect("CannotBeVoted", 1);
    }

    remove() {
        this.cannotVoteEffect.remove();
        this.cannotBeVotedEffect.remove();
        
        super.remove();
    }
};