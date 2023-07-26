const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class WinWithIndependentLead extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      againOnFinished: true,
      check: function (counts, winners, aliveCount, confirmedFinished) {
        if (
          confirmedFinished &&
          Object.values(winners.groups)
            .flat()
            .find((p) => p === this.data.sidekickLead)
        ) {
          winners.addPlayer(this.player, this.name);
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (this.player !== player) {
          return;
        }
        let lead = Random.randArrayVal(
          this.game.players.filter(
            (p) => p.role.alignment === this.alignment && p !== this.player
          )
        );
        if (lead) {
          this.data.sidekickLead = lead;
          this.player.queueAlert(`:star: Your leader is ${lead.name}!`);
          lead.queueAlert(
            `:star: You got yourself a sidekick: ${this.player.name}!`
          );
        } else {
          this.player.queueAlert(
            ":star: You couldn't find a suitable leader..."
          );
          this.player.setRole("Survivor");
        }
      },
    };
  }
};
