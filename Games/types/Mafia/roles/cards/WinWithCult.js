const Card = require("../../Card");
const {
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_SUNSET_DEFAULT,
} = require("../../const/Priority");

module.exports = class WinWithCult extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        if (counts["Cult"] >= aliveCount / 2 && aliveCount > 0)
          this.game.players.filter((e) => e.role.name === "Seer").length > 0 &&
            this.game.players.filter((e) => e.role.name === "Seer").length <=
              this.game.guessedSeers?.length;
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
            if (action.target && action.hasLabels(["condemn", "overthrow"])) {
              isOverthrow = true;
              target = action.target;
            } else if (
              !isOverthrow &&
              action.target &&
              action.hasLabel("condemn")
            ) {
              target = action.target;
            }
          }
          return target === this.player;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.target.role.name === "Seer") {
              if (!this.game.guessedSeers) {
                this.game.guessedSeers = [];
              }
              this.game.guessedSeers.push(this.target);
              this.target.kill("condemnRevenge", this.actor);
            }
          },
        },
      },
    };
    this.stateMods = {
      Day: {
        type: "delayActions",
        delayActions: true,
      },
      Overturn: {
        type: "delayActions",
        delayActions: true,
      },
      Sunset: {
        type: "add",
        index: 5,
        length: 1000 * 30,
        shouldSkip: function () {
          if (
            this.game.players.filter((e) => e.role.name === "Seer").length === 0
          ) {
            return true;
          }
          let isOverthrow, target;
          for (const action of this.game.actions[0]) {
            if (action.target && action.hasLabels(["condemn", "overthrow"])) {
              isOverthrow = true;
              target = action.target;
            } else if (
              !isOverthrow &&
              action.target &&
              action.hasLabel("condemn")
            ) {
              target = action.target;
            }
          }
          return target !== this.player;
        },
      },
    };
  }
};
