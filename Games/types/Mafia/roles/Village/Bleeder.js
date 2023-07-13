const Role = require("../../Role");

module.exports = class Bleeder extends Role {

    constructor(player, data) {
        super("Bleeder", player, data);
        this.alignment = "Village";
        this.cards = ["VillageCore", "WinWithVillage", "ConvertKillToPoison"];
    }

}