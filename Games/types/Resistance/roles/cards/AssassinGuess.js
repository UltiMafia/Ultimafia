const Card = require("../../Card");
const Winners = require("../../../../core/Winners");

module.exports = class AssassinGuess extends Card {
  constructor(role) {
    super(role);

    this.meetings = {
      "Assassinate Merlin": {
        states: ["Epilogue"],
        flags: ["group", "voting", "mustAct"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        action: {
          run: function () {
            const winnerGroup =
              this.target.role.name === "Merlin" ? "Spies" : "Resistance";
            if (this.game.FirstLover != null && this.game.SecondLover != null) {
              return;
            }
            const winners = new Winners(this.game);
            winners.addGroup(winnerGroup);
            for (let player of this.game.players) {
              if (player.role.alignment !== winnerGroup) {
                player.kill();
              } else {
                winners.addPlayer(player);
              }
            }
            this.game.endGame(winners);
          },
        },
        shouldMeet: function () {
          let Merlins = this.game.players.filter(
            (p) => p.role.name == "Merlin"
          );

          if (Merlins.length <= 0) {
            return false;
          }
          return true;
        },
      },
      "Assassinate First Lover": {
        states: ["Epilogue"],
        flags: ["group", "voting"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        action: {
          priority: 0,
          run: function () {
            this.game.FirstLover = this.target;
          },
        },
        shouldMeet: function () {
          let Lovers = this.game.players.filter(
            (p) => p.role.name == "Isolde" || p.role.name == "Tristan"
          );

          if (Lovers.length <= 1) {
            return false;
          }

          return true;
        },
      },
      "Assassinate Second Lover": {
        states: ["Epilogue"],
        flags: ["group", "voting"],
        targetType: "player",
        targets: { include: ["Resistance"], exclude: [""] },
        action: {
          priority: 1,
          run: function () {
            this.game.SecondLover = this.target;
            if (this.game.FirstLover != null) {
              let winnerGroup;
              if (
                this.game.FirstLover.role.name == "Tristan" ||
                this.game.FirstLover.role.name == "Isolde"
              ) {
                if (this.game.FirstLover != this.target) {
                  if (
                    this.target.role.name == "Tristan" ||
                    this.target.role.name == "Isolde"
                  ) {
                    winnerGroup = "Spies";
                  } else {
                    winnerGroup = "Resistance";
                  }
                }
              } else {
                winnerGroup = "Resistance";
              }

              const winners = new Winners(this.game);
              winners.addGroup(winnerGroup);
              for (let player of this.game.players) {
                if (player.role.alignment !== winnerGroup) {
                  player.kill();
                } else {
                  winners.addPlayer(player);
                }
              }
              this.game.endGame(winners);
            }
          },
        },
        shouldMeet: function () {
          let Lovers = this.game.players.filter(
            (p) => p.role.name == "Isolde" || p.role.name == "Tristan"
          );

          if (Lovers.length <= 1) {
            return false;
          }

          return true;
        },
      },
    };
  }
};
