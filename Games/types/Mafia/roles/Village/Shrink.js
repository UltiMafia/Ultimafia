const Role = require("../../Role");

module.exports = class Shrink extends Role {

    constructor(player, data) {
        super("Shrink", player, data);
        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage", "CureAllMadness"];
    }

}
