const Card = require("../../Card");
const {
  PRIORITY_WIN_CHECK_DEFAULT,
  PRIORITY_SUNSET_DEFAULT,
} = require("../../const/Priority");

module.exports = class WinWithMafia extends Card {
  constructor(role) {
    super(role);

    this.winCheck = {
      priority: PRIORITY_WIN_CHECK_DEFAULT,
      check: function (counts, winners, aliveCount) {
        const hasMajority = counts["Mafia"] >= aliveCount / 2 && aliveCount > 0;
        if (hasMajority) {
          winners.addPlayer(
            this.player,
            this.player.role.alignment === "Mafia"
              ? "Mafia"
              : this.player.role.name
          );
        }

        var hasDignitaries = false;
        var dignitaryCount = 0;
        for (let p of this.game.players) {
          if (p.role.name == "Dignitary") {
            hasDignitaries = true;
            dignitaryCount += p.alive ? 1 : -1;
          }
        }

        if (hasDignitaries && dignitaryCount <= 0) {
          winners.addPlayer(
            this.player,
            this.player.role.alignment == "Mafia"
              ? "Mafia"
              : this.player.role.name
          );
        }

        // win by guessing seer
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );
        if (seersInGame.length <= 0) {
          return;
        }

        if (seersInGame.length == this.game.guessedSeers["Mafia"].length) {
          winners.addPlayer(
            this.player,
            this.player.role.alignment == "Mafia"
              ? "Mafia"
              : this.player.role.name
          );
          return;
        }
      },
    };

    this.listeners = {
      start: function () {
        if (this.oblivious["Mafia"]) return;

        for (let player of this.game.players) {
          if (
            player.role.alignment === "Mafia" &&
            player !== this.player &&
            player.role.name !== "Politician" &&
            !player.role.oblivious["self"]
          ) {
            this.revealToPlayer(player);
          }
        }

        if (!this.game.guessedSeers) {
          this.game.guessedSeers = {};
        }
        this.game.guessedSeers["Mafia"] = [];
      },
    };

    // seer meeting and state mods
    this.meetings = {
      "Guess Seer": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          if (
            this.game.players.filter((p) => p.role.name == "Seer").length <= 0
          ) {
            return false;
          }

          for (const action of this.game.actions[0]) {
            if (action.hasLabel("condemn") && action.target == this.player) {
              return true;
            }
          }

          return false;
        },
        action: {
          labels: ["kill"],
          priority: PRIORITY_SUNSET_DEFAULT,
          run: function () {
            if (this.target.role.name !== "Seer") {
              return;
            }

            this.game.guessedSeers["Mafia"].push(this.target);
            this.target.kill("condemnRevenge", this.actor);
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
            this.game.players.filter((p) => p.role.name == "Seer").length <= 0
          ) {
            return true;
          }

          for (let action of this.game.actions[0])
            if (action.target == this.player && action.hasLabel("condemn"))
              return false;

          return true;
        },
      },
    };
  }
};
