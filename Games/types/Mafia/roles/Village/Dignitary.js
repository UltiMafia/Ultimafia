const Role = require("../../Role");

module.exports = class Dignitary extends Role {

    constructor(player, data) {
        super("Dignitary", player, data);
        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage"];
    }

}