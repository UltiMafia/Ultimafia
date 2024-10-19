const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");
const Random = require("../../../../../lib/Random");

module.exports = class WinWithIndependentLead extends Card {
  constructor(role) {
    super(role);

    this.actions = [
      {
        priority: PRIORITY_INVESTIGATIVE_DEFAULT,
        run: function () {
          if (!this.actor.alive) return;
          if (!this.actor.role.data.sidekickLead.alive) return;
          if (
            this.game.getStateName() != "Dusk" &&
            this.game.getStateName() != "Day"
          )
            return;

          this.actor.role.data.sidekickLead.holdItem(
            "WackyJoinFactionMeeting",
            `Sidekick with ${this.player.name}`
          );
          this.actor.holdItem(
            "WackyJoinFactionMeeting",
            `Sidekick with ${this.player.name}`
          );
        },
      },
    ];

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
            (p) => p.role.alignment === "Independent" && p !== this.player
          )
        );

        if (
          this.data.OldRole &&
          this.game.players.filiter(
            (p) =>
              p.role.name == this.data.OldRole &&
              p.role.alignment === "Independent" &&
              p !== this.player
          ).length > 0
        ) {
          lead = Random.randArrayVal(
            this.game.players.filiter(
              (p) =>
                p.role.name == this.data.OldRole &&
                p.role.alignment === "Independent" &&
                p !== this.player
            )
          );
        }

        if (lead) {
          this.data.sidekickLead = lead;
          this.player.queueAlert(`:star: Your leader is ${lead.name}!`);
          lead.queueAlert(
            `:star: You got yourself a sidekick: ${this.player.name}!`
          );
          lead.holdItem(
            "WackyJoinFactionMeeting",
            `Sidekick with ${this.player.name}`
          );
          this.player.holdItem(
            "WackyJoinFactionMeeting",
            `Sidekick with ${this.player.name}`
          );
        } else {
          this.player.queueAlert(":star: You couldn't find a suitable leader…");
          this.player.setRole("Survivor");
        }
      },
    };
  }
};
