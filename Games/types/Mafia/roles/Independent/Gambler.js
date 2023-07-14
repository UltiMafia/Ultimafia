const Role = require("../../Role");

module.exports = class Gambler extends Role {

    constructor(player, data) {
        super("Gambler", player, data);

        this.alignment = "Independent";
        this.cards = ["VillageCore", "ChallengeTarget", "WinWithTwoGambleWins"];
    }

}