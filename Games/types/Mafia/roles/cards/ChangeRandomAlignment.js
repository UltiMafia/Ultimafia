const Card = require("../../Card");
const Random = require("../../../../../lib/Random");

module.exports = class ChangeRandomAlignment extends Card {

    constructor(role) {
        super(role);

        this.methods.changeAlignment = function() {
            let alignment = Random.randArrayVal(["Village", "Mafia", "Cult"])
            this.player.role.alignment = alignment;
            this.player.queueAlert(`:sy5g: You believe that siding with the ${alignment} will help your career!`)
        }

        this.listeners = {
            "roleAssigned": function(player) {
                if (player !== this.player)
                    return;
                this.player.role.methods.changeAlignment();
            },
            "state": function(stateInfo) {
                if (stateInfo.name.match(/Day/) && stateInfo.dayCount > 0 && stateInfo.dayCount % 2 === 0) {
                    this.player.role.methods.changeAlignment();
                }
            }
        }
    }

}