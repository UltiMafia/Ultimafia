const Role = require("../../Role");

module.exports = class Comedian extends Role {

    constructor(player, data) {
        super("Comedian", player, data);

        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage", "TellJoke"];
    }

}