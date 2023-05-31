const Role = require("../../Role");

module.exports = class Tree extends Role {

    constructor(player, data) {
        super("Tree", player, data);
        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage"];
        this.immunity.kill = 3;
        this.cancelImmunity = ["ignite"];
        this.startEffects = ["CannotBeVoted"];
        this.meetingMods = {
            "Village": {
                canVote: false
            }
        }
    }

}
