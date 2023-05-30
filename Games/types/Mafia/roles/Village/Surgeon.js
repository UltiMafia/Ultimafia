const Role = require("../../Role");

module.exports = class Surgeon extends Role {

    constructor(player, data) {
        super("Surgeon", player, data);

        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage", "NightSurgeon"];

    }

}