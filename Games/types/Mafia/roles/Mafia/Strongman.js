const Role = require("../../Role");

module.exports = class Strongman extends Role {

    constructor(player, data) {
        super("Strongman", player, data);
        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "MakeKillStronger"];
    }

}