const Role = require("../../Role");

module.exports = class Forger extends Role {

    constructor(player, data) {
        super("Forger", player, data);

        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "ForgeWill"];
    }

}