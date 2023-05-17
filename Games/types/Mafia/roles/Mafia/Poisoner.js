const Role = require("../../Role");

module.exports = class Poisoner extends Role {

    constructor(player, data) {
        super("Poisoner", player, data);

        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "Poisoner"];
    }

}
