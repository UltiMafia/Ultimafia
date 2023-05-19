const Role = require("../../Role");

module.exports = class Sharpshooter extends Role {

    constructor(player, data) {
        super("Sharpshooter", player, data);
        this.alignment = "Mafia";
        this.cards = ["VillageCore", "WinWithMafia", "MeetingMafia", "DefendAndSnatchGun"];
    }

}
