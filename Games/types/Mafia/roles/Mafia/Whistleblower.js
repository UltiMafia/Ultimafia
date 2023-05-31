const Role = require("../../Role");

module.exports = class Whistleblower extends Role {

    constructor(player, data) {
        super("Whistleblower", player, data);
        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "BlowWhistle"];
    }

}
