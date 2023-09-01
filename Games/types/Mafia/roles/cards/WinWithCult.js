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
        function cultWin(role) {
          winners.addPlayer(
            role.player,
            role.alignment === "Cult" ? "Cult" : role.name
          );
        }

        const soldiersInGame = this.game.players.filter(
          (p) => p.role.name == "Soldier"
        );

        if (soldiersInGame.length > 0) {
          if (soldiersInGame.length == aliveCount / 2 && aliveCount > 0) {
            // soldiers are present, cult cannot win
            return;
          }
        }

        // win by majority
        if (counts["Cult"] >= aliveCount / 2 && aliveCount > 0) {
          cultWin(this);
          return;
        }

        const numOccultistsAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Occultist"
        ).length;
        if (counts["Cult"] + numOccultistsAlive == aliveCount) {
          cultWin(this);
          return;
        }

        // win by guessing seer
        const seersInGame = this.game.players.filter(
          (p) => p.role.name == "Seer"
        );
        if (seersInGame.length <= 0) {
          return;
        }

        if (
          seersInGame.length > 0 &&
          seersInGame.length == this.game.guessedSeers["Cult"].length
        ) {
          cultWin(this);
          return;
        }

        // win with benandante
        const benandanteAlive =
          this.game.players.filter(
            (p) => p.alive && p.role.name == "Benandante"
          ).length > 0;
        if (benandanteAlive && winners.groups["Mafia"]) {
          cultWin(this);
          return;
        }
      },
    };
    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;
        
        if (!this.game.guessedSeers) {
          this.game.guessedSeers = {};
        }
        this.game.guessedSeers["Cult"] = [];

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

            this.game.guessedSeers["Cult"].push(this.target);
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
