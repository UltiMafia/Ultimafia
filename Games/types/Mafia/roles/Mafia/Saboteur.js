const Role = require("../../Role");

module.exports = class Saboteur extends Role {

    constructor(player, data) {
        super("Saboteur", player, data);
        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "SabotageAllItems"];
    }

}