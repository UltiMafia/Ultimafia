const Card = require("../../Card");
const { PRIORITY_WIN_CHECK_DEFAULT } = require("../../const/Priority");

module.exports = class WinWithCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts["Cult"] >= aliveCount / 2 && aliveCount > 0)
          winners.addPlayer(this.player, "Cult");
      },
    };
    this.listeners = {
      start: function () {
        if (this.oblivious["Cult"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Cult" &&
            player !== this.player &&
            player.role.name !== "Politician" &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }
      },
    };
    // Seer meeting and state
    this.meetings = {
      "Guess Seer": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          if (
            this.game.players.filter((e) => e.role.name === "Seer").length === 0
          ) {
            return false;
          }
          let isOverthrow, target;
          for (const action of this.game.actions[0]) {
            if (action.target && action.hasLabels(["lynch", "overthrow"])) {
              isOverthrow = true;
              target = action.target;
            } else if (
              !isOverthrow &&
              action.target &&
              action.hasLabel("lynch")
            ) {
              target = action.target;
            }
          }
          return target === this.player;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_LYNCH_REVENGE,
          run: function () {
            if (this.target.role.name === "Seer") {
              if (!this.game.guessedSeers) {
                this.game.guessedSeers = [];
              }
              this.game.guessedSeers.push(this.target);
              this.target.kill("lynchRevenge", this.actor);
            }
          },
        },
      },
    };
  }
};
