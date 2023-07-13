const Role = require("../../Role");

module.exports = class Leprechaun extends Role {

    constructor(player, data) {
        super("Leprechaun", player, data);

        this.alignment = "Independent";
        this.cards = ["VillageCore", "StealAllItemsAndClovers", "WinByStealingClovers"];
    }
}