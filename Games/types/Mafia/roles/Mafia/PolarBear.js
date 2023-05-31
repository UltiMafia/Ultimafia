const Role = require("../../Role");

module.exports = class PolarBear extends Role {

    constructor(player, data) {
        super("Polar Bear", player, data);
        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Polariser", "PenguinEater"];
    }

}
