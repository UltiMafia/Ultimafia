const Role = require("../../Role");

module.exports = class Host extends Role {

    constructor(player, data) {
        super("Host", player, data);

        this.alignment = "Independent";
        this.winCount = "Village";
        this.immunity["kill"] = Infinity;

        this.cards = [
            "VillageCore",
            "EndGameAtAnyTime"
        ];
    }

}
