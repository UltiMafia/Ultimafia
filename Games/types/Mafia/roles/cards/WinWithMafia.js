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
            role.alignment === "Mafia" ? "Mafia" : role.name
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

        const numTraitorsAlive = this.game.players.filter(
          (p) => p.alive && p.role.name == "Traitor"
        ).length;
        if (counts["Mafia"] + numTraitorsAlive == aliveCount) {
          mafiaWin(this);
          return;
        }

        // win by killing senators
        var hasSenators = false;
        var senatorCount = 0;
        for (let p of this.game.players) {
          if (p.role.name == "Senator") {
            hasSenators = true;
            senatorCount += p.alive ? 1 : -1;
          }
        }

        if (hasSenators && senatorCount <= 0) {
          mafiaWin(this);
          return;
        }

        // win by killing president
        if (this.killedPresident) {
          mafiaWin(this);
          return;
        }

        // win by guessing snitch
        const snitchesInGame = this.game.players.filter(
          (p) => p.role.name == "Snitch"
        );
        if (
          snitchesInGame.length > 0 &&
          snitchesInGame.length == this.game.guessedSnitches["Mafia"].length
        ) {
          mafiaWin(this);
          return;
        }

        // win with benandante
        const benandanteAlive =
          this.game.players.filter(
            (p) => p.alive && p.role.name == "Benandante"
          ).length > 0;
        if (benandanteAlive && winners.groups["Cult"]) {
          mafiaWin(this);
          return;
        }
      },
    };

    this.listeners = {
      roleAssigned: function (player) {
        if (player !== this.player) return;

        if (!this.game.guessedSnitches) {
          this.game.guessedSnitches = {};
        }
        this.game.guessedSnitches["Mafia"] = [];

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
      },
      death: function (player) {
        if (player.role.name == "President") {
          this.killedPresident = true;
        }
      },
    };

    // snitch meeting and state mods
    this.meetings = {
      "Guess Snitch": {
        states: ["Sunset"],
        flags: ["voting"],
        shouldMeet: function () {
          if (
            this.game.players.filter((p) => p.role.name == "Snitch").length <= 0
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
            if (this.target.role.name !== "Snitch") {
              return;
            }

            this.game.guessedSnitches["Mafia"].push(this.target);
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
            this.game.players.filter((p) => p.role.name == "Snitch").length <= 0
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
