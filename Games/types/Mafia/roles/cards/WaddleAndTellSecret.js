const Card = require("../../Card");
const Random = require("../../../../../lib/Random");
const { PRIORITY_INVESTIGATIVE_DEFAULT } = require("../../const/Priority");

module.exports = class WaddleAndTellSecret extends Card {

    constructor(role) {
        super(role);

        this.meetings = {
            "Waddle to": {
                states: ["Night"],
                flags: ["voting"],
                action: {
                    labels: ["investigate"],
                    priority: PRIORITY_INVESTIGATIVE_DEFAULT,
                    run: function () {
                        let chosenSecretType = Random.randInt(0, 2);
                        let tellSecretAbout = Random.randArrayVal(this.game.alivePlayers());

                        var secretMessage
                        switch (chosenSecretType) {
                            case 0:
                                // snoop
                                let items = this.snoopAllItems(tellSecretAbout);
                                let secretItem = Random.randArrayVal(items);

                                secretMessage = `is carrying ${secretItem || "nothing"}`;
                                break;
                            case 1:
                                // visitedBy
                                let visitors = this.getVisitors(tellSecretAbout);
                                let secretVisitor = Random.randArrayVal(visitors);

                                secretMessage = `was visited by ${secretVisitor?.name || "no one"}`;
                                break;
                            case 2:
                                // visitedWho
                            default:
                                let visited = this.getVisits(tellSecretAbout);
                                let secretVisit = Random.randArrayVal(visited);

                                secretMessage = `visited ${secretVisit || "no one"}`;
                        }

                        this.target.queueAlert(`A penguin waddles up to you and tells you that ${tellSecretAbout.name} ${secretMessage}.`);
                    }
                }
            }
        }
    };

}
