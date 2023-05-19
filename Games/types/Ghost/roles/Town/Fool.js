const Role = require("../../Role");

module.exports = class Fool extends Role {

    constructor(player, data) {
        super("Fool", player, data);

        this.alignment = "Town";
        this.cards = ["TownCore", "WinWithTown", "AnnounceAndCheckWord"];
        this.appearance = {
            self: "Town"
        };
        
        this.listeners = {
            "roleAssigned": [
                function (player) {
                    if (player != this.player) {
                        return;
                    }
                    
                    this.word = this.game.foolWord;
                }
            ]
        };
    }

}