const Role = require("../../Role");

module.exports = class Siren extends Role {

    constructor(player, data) {
        super("Siren", player, data);

        this.alignment = "Independent";
        this.cards = ["VillageCore", "WinIfBeckons", "KillBeckoned"];
    }

}