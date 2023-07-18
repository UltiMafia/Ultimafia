const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class WinWithIndependentLead extends Card {

    constructor(role) {
        super(role);

        this.winCheck = {
            priority: PRIORITY_WIN_CHECK_DEFAULT,
            againOnFinished: true,
            check: function(counts, winners, aliveCount, confirmedFinished) {

                if (
                    (confirmedFinished && Object.values(winners.groups).flat().find(e => e === this.data.sidekickLead))
                ) {
                    winners.addPlayer(this.player, this.name)
                }
            }
        };

        this.listeners = {
            "roleAssigned": function(player) {
                if (this.player !== player) {
                    return;
                }
                let lead = Random.randArrayVal(this.game.players.filter(e => e !== this.player && e.role.alignment === this.player.role.alignment));
                if (lead) {
                    this.player.role.data.sidekickLead = lead;
                    this.player.queueAlert(`:star: Your leader is ${lead.name}!`);
                    lead.queueAlert(`:star: Your got yourself a sidekick: ${lead.name}!`);
                } else {
                    this.player.queueAlert(":star: You couldn't find a suitable leader...");
                    this.player.setRole("Survivor")
                }

            }
        }


    }

}