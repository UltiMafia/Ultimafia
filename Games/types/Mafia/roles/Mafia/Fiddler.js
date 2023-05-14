const Role = require("../../Role");

module.exports = class Fiddler extends Role {

    constructor(player, data) {
        super("Fiddler", player, data);

        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "Fiddler"];
    }

}