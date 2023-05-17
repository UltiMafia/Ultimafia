const Role = require("../../Role");

module.exports = class Mistletoe extends Role {

    constructor(player, data) {
        super("Mistletoe", player, data);

        this.alignment = "Independent";
        this.cards = ["VillageCore", "MeetYourMatch", "WinIfLoveConquersAll"];
    }

}
