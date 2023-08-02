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
        function mafiaWin(role) {
          winners.addPlayer(
            role.player,
            role.player.role.alignment === "Mafia"
              ? "Mafia"
              : role.player.role.name
          );
        }
        
        const soldiersInGame = this.game.players.filter(
          (p) => p.role.name == "Soldier"
        );

        if (soldiersInGame.length > 0) {
          if (soldiersInGame.length == aliveCount / 2 && aliveCount > 0) {
            // soldiers are present, mafia cannot win
            return;
          }
        }

        const hasMajority = counts["Mafia"] >= aliveCount / 2 && aliveCount > 0;
        if (hasMajority) {
          mafiaWin(this);
          return;
        }

        // win by killing dignitaries
        var hasDignitaries = false;
        var dignitaryCount = 0;
        for (let p of this.game.players) {
          if (p.role.name == "Dignitary") {
            hasDignitaries = true;
            dignitaryCount += p.alive ? 1 : -1;
          }
        }

        if (hasDignitaries && dignitaryCount <= 0) {
          mafiaWin(this);
          return;
        }

        // win by killing president
        if (this.killedPresident) {
          mafiaWin(this);
          return;
        }

        // win by guessing seer
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );
        if (seersInGame.length <= 0) {
          return;
        }

        if (seersInGame.length == this.game.guessedSeers["Mafia"].length) {
          mafiaWin(this);
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
      death: function(player) {
        if (player.role.name == "President") {
          this.killedPresident = true;
        }
      }
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
